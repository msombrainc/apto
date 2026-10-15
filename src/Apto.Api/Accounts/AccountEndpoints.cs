using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.QuickBooks;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Accounts;

public static class AccountEndpoints
{
    public static RouteGroupBuilder MapAccountEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/accounts");

        group.MapGet("/", ListAccounts);
        group.MapPost("/", CreateAccount);
        group.MapPut("/{id:guid}", UpdateAccount);
        group.MapPost("/{id:guid}/qbo-sync", ManualQboSync);

        return group;
    }

    private static async Task<IResult> ListAccounts(string? q, AptoDbContext db, CancellationToken ct)
    {
        var query = db.Accounts.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(a =>
                a.Name.ToLower().Contains(term) || a.Code.ToLower().Contains(term));
        }

        var items = await query
            .OrderBy(a => a.Name)
            .Select(a => ToResponse(a))
            .ToListAsync(ct);

        return Results.Ok(items);
    }

    private static async Task<IResult> CreateAccount(
        AccountWriteRequest request,
        AptoDbContext db,
        IQboSyncEnqueueService enqueue,
        CancellationToken ct)
    {
        if (!AccountValidation.TryValidate(request, out var error))
            return Results.BadRequest(new { error });

        var normalizedCode = request.Code.Trim();
        if (await db.Accounts.AnyAsync(a => a.Code == normalizedCode, ct))
            return Results.Conflict(new { error = "account code already exists." });

        var account = new Account
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Code = normalizedCode,
            SlaReceivingDays = request.SlaReceivingDays,
            SlaProcessingDays = request.SlaProcessingDays,
            SlaShippingDays = request.SlaShippingDays,
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.Accounts.Add(account);
        await db.SaveChangesAsync(ct);

        var enqueued = await enqueue.EnqueueAccountCustomerAsync(account, isCreate: true, ct);
        if (enqueued is null)
            account.QboSyncStatus = QboSyncStatus.Skipped;

        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/accounts/{account.Id}", ToResponse(account));
    }

    private static async Task<IResult> UpdateAccount(
        Guid id,
        AccountWriteRequest request,
        AptoDbContext db,
        IQboSyncEnqueueService enqueue,
        CancellationToken ct)
    {
        if (!AccountValidation.TryValidate(request, out var error))
            return Results.BadRequest(new { error });

        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (account is null)
            return Results.NotFound();

        var normalizedCode = request.Code.Trim();
        if (await db.Accounts.AnyAsync(a => a.Id != id && a.Code == normalizedCode, ct))
            return Results.Conflict(new { error = "account code already exists." });

        var nameChanged = !string.Equals(account.Name, request.Name.Trim(), StringComparison.Ordinal);
        var codeChanged = !string.Equals(account.Code, normalizedCode, StringComparison.Ordinal);

        account.Name = request.Name.Trim();
        account.Code = normalizedCode;
        account.SlaReceivingDays = request.SlaReceivingDays;
        account.SlaProcessingDays = request.SlaProcessingDays;
        account.SlaShippingDays = request.SlaShippingDays;

        await db.SaveChangesAsync(ct);

        if (nameChanged || codeChanged)
            await enqueue.EnqueueAccountCustomerAsync(account, isCreate: false, ct);

        return Results.Ok(ToResponse(account));
    }

    private static async Task<IResult> ManualQboSync(
        Guid id,
        AptoDbContext db,
        IQboSyncEnqueueService enqueue,
        CancellationToken ct)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (account is null)
            return Results.NotFound();

        var row = await enqueue.EnqueueManualAccountSyncAsync(account, ct);
        if (row is null)
            return Results.Json(new { error = "QuickBooks is not configured." }, statusCode: 503);

        return Results.Accepted($"/api/qbo/requests/{row.Id}", new { requestId = row.Id });
    }

    private static AccountResponse ToResponse(Account account) =>
        new(
            account.Id,
            account.Name,
            account.Code,
            account.SlaReceivingDays,
            account.SlaProcessingDays,
            account.SlaShippingDays,
            account.CreatedAtUtc,
            account.QboCustomerId,
            account.QboSyncStatus,
            account.QboSyncError);
}
