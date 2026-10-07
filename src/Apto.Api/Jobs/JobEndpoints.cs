using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Jobs;

public static class JobEndpoints
{
    public static RouteGroupBuilder MapJobEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/jobs");

        group.MapGet("/facilities", () => Results.Ok(SlaStatusCalculator.AllowedFacilities));
        group.MapGet("/", ListJobs);
        group.MapGet("/{id:guid}", GetJob);
        group.MapPost("/", CreateJob);
        group.MapPut("/{id:guid}", UpdateJob);

        return group;
    }

    private static async Task<IResult> ListJobs(
        Guid? accountId,
        string? q,
        AptoDbContext db,
        CancellationToken ct)
    {
        var query = db.Jobs.AsNoTracking().Include(j => j.Account).AsQueryable();

        if (accountId is { } aid)
            query = query.Where(j => j.AccountId == aid);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(j =>
                (j.OpsStatus != null && j.OpsStatus.ToLower().Contains(term))
                || (j.FacilityCode != null && j.FacilityCode.ToLower().Contains(term))
                || j.Account.Name.ToLower().Contains(term));
        }

        var items = await query
            .OrderBy(j => j.DueDateUtc)
            .ToListAsync(ct);

        return Results.Ok(items.Select(j => ToResponse(j, j.Account)).ToList());
    }

    private static async Task<IResult> GetJob(Guid id, AptoDbContext db, CancellationToken ct)
    {
        var job = await db.Jobs.AsNoTracking().Include(j => j.Account)
            .FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job is null)
            return Results.NotFound();

        return Results.Ok(ToResponse(job, job.Account));
    }

    private static async Task<IResult> CreateJob(
        JobWriteRequest request,
        AptoDbContext db,
        CancellationToken ct)
    {
        if (!JobValidation.TryValidate(request, out var error))
            return Results.BadRequest(new { error });

        var account = await db.Accounts.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.AccountId, ct);
        if (account is null)
            return Results.BadRequest(new { error = "account not found." });

        var due = request.DueDateUtc?.Date
            ?? SlaStatusCalculator.DefaultDueDateUtc(request.StartDateUtc, account).Date;

        var job = new Job
        {
            Id = Guid.NewGuid(),
            AccountId = request.AccountId,
            FacilityCode = NormalizeFacility(request.FacilityCode),
            OpsStatus = request.OpsStatus?.Trim(),
            StartDateUtc = request.StartDateUtc,
            DueDateUtc = due,
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.Jobs.Add(job);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/jobs/{job.Id}", ToResponse(job, account));
    }

    private static async Task<IResult> UpdateJob(
        Guid id,
        JobWriteRequest request,
        AptoDbContext db,
        CancellationToken ct)
    {
        if (!JobValidation.TryValidate(request, out var error))
            return Results.BadRequest(new { error });

        var job = await db.Jobs.Include(j => j.Account).FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job is null)
            return Results.NotFound();

        if (job.AccountId != request.AccountId)
        {
            var account = await db.Accounts.AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == request.AccountId, ct);
            if (account is null)
                return Results.BadRequest(new { error = "account not found." });
            job.AccountId = request.AccountId;
            job.Account = account;
        }

        var slaAccount = job.Account;
        var due = request.DueDateUtc?.Date
            ?? SlaStatusCalculator.DefaultDueDateUtc(request.StartDateUtc, slaAccount).Date;

        job.FacilityCode = NormalizeFacility(request.FacilityCode);
        job.OpsStatus = request.OpsStatus?.Trim();
        job.StartDateUtc = request.StartDateUtc;
        job.DueDateUtc = due;

        await db.SaveChangesAsync(ct);

        return Results.Ok(ToResponse(job, slaAccount));
    }

    private static string? NormalizeFacility(string? facilityCode)
    {
        if (string.IsNullOrWhiteSpace(facilityCode))
            return null;
        return facilityCode.Trim().ToUpperInvariant();
    }

    private static JobResponse ToResponse(Job job, Account account)
    {
        var due = job.DueDateUtc ?? SlaStatusCalculator.DefaultDueDateUtc(
            job.StartDateUtc ?? DateTime.UtcNow,
            account);
        var total = SlaStatusCalculator.TotalSlaDays(account);
        var remaining = SlaStatusCalculator.DaysRemaining(due);
        var status = SlaStatusCalculator.SlaStatus(remaining);

        return new JobResponse(
            job.Id,
            job.AccountId,
            account.Name,
            job.FacilityCode,
            job.OpsStatus,
            job.StartDateUtc,
            job.DueDateUtc,
            total,
            remaining,
            status,
            job.CreatedAtUtc);
    }
}
