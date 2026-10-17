using Apto.Api.Accounts;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.QuickBooks;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Jobs;

public static class JobInvoiceEndpoints
{
    public static RouteGroupBuilder MapJobInvoiceEndpoints(this RouteGroupBuilder jobs)
    {
        jobs.MapGet("/{id:guid}/invoice-preview", InvoicePreview);
        jobs.MapGet("/{id:guid}/invoices", ListInvoices);
        jobs.MapPost("/{id:guid}/invoices", CreateInvoice);
        return jobs;
    }

    private static async Task<IResult> InvoicePreview(Guid id, AptoDbContext db, CancellationToken ct)
    {
        var body = await JobInvoicePreview.BuildAsync(db, id, ct);
        return body is null ? Results.NotFound() : Results.Ok(body);
    }

    private static async Task<IResult> ListInvoices(Guid id, AptoDbContext db, CancellationToken ct)
    {
        if (!await db.Jobs.AsNoTracking().AnyAsync(j => j.Id == id, ct))
            return Results.NotFound();

        var rows = await db.ServiceInvoices.AsNoTracking()
            .Where(i => i.JobId == id)
            .OrderByDescending(i => i.CreatedAtUtc)
            .Select(i => new
            {
                i.Id,
                i.Status,
                i.Total,
                i.Note,
                i.QboDocNumber,
                i.QboInvoiceId,
                i.LastError,
                i.CreatedAtUtc,
                lines = i.LinesJson,
            })
            .ToListAsync(ct);

        return Results.Ok(rows);
    }

    private static async Task<IResult> CreateInvoice(
        Guid id,
        CreateServiceInvoiceRequest request,
        AptoDbContext db,
        IQboSyncEnqueueService enqueue,
        CancellationToken ct)
    {
        var job = await db.Jobs.Include(j => j.Account).FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job is null)
            return Results.NotFound();

        if (string.IsNullOrEmpty(job.Account.QboCustomerId))
            return Results.BadRequest(new
            {
                error = "Account is not synced to QuickBooks. Sync the customer first (Account detail → QuickBooks).",
                code = "qbo_customer_missing",
            });

        if (request.Lines is null || request.Lines.Count == 0)
            return Results.BadRequest(new { error = "At least one invoice line is required." });

        var settings = AccountSettingsJson.Parse(job.Account.Settings);
        var preview = await JobInvoicePreview.BuildAsync(db, id, ct);
        if (preview is null)
            return Results.NotFound();

        var lineWrites = new List<JobInvoicePreview.InvoiceLineWrite>();
        decimal total = 0;
        foreach (var line in request.Lines)
        {
            if (line.Quantity < 0)
                return Results.BadRequest(new { error = $"Quantity for {line.ServiceKey} must be non-negative." });

            var rate = ResolveRate(settings.Fees, line.ServiceKey);
            if (rate is null)
                return Results.BadRequest(new { error = $"Unknown or unpriced service: {line.ServiceKey}." });

            if (line.Quantity == 0)
                continue;

            var amount = Math.Round(rate.Value * line.Quantity, 2, MidpointRounding.AwayFromZero);
            total += amount;
            lineWrites.Add(new JobInvoicePreview.InvoiceLineWrite(
                line.ServiceKey, line.Quantity, rate.Value, amount));
        }

        if (lineWrites.Count == 0)
            return Results.BadRequest(new { error = "At least one line must have quantity greater than zero." });

        var now = DateTime.UtcNow;
        var invoice = new ServiceInvoice
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            AccountId = job.AccountId,
            LinesJson = JobInvoicePreview.SerializeLines(lineWrites),
            Total = total,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Status = "Queued",
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
        db.ServiceInvoices.Add(invoice);
        await db.SaveChangesAsync(ct);

        var syncRow = await enqueue.EnqueueServiceInvoiceAsync(invoice, job.Account, ct);
        if (syncRow is null)
        {
            invoice.Status = "Failed";
            invoice.LastError = "QuickBooks integration is not configured.";
            invoice.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Json(new { invoice.Id, invoice.Status, invoice.LastError }, statusCode: 503);
        }

        return Results.Created($"/api/jobs/{id}/invoices/{invoice.Id}", new
        {
            invoice.Id,
            invoice.Status,
            invoice.Total,
            syncRequestId = syncRow.Id,
        });
    }

    private static decimal? ResolveRate(AccountFeesDto fees, string key) => key switch
    {
        "audit" => fees.Audit,
        "wipe" => fees.Wipe,
        "shred" => fees.Shred,
        "recycle" => fees.Recycle,
        _ => null,
    };
}

public sealed class CreateServiceInvoiceRequest
{
    public List<CreateServiceInvoiceLine> Lines { get; set; } = [];

    public string? Note { get; set; }
}

public sealed class CreateServiceInvoiceLine
{
    public required string ServiceKey { get; set; }

    public int Quantity { get; set; }
}
