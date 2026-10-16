using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Assets;

public static class AssetEndpoints
{
    public static RouteGroupBuilder MapAssetEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api");
        group.MapGet("/jobs/{jobId:guid}/assets", ListForJob);
        group.MapPost("/jobs/{jobId:guid}/assets", CreateForJob);
        group.MapGet("/assets/lookup", LookupByCode);
        group.MapGet("/assets", ListInventory);
        group.MapGet("/assets/{id:guid}", GetAsset);
        group.MapPut("/assets/{id:guid}", UpdateAsset);
        return group;
    }

    private static async Task<IResult> LookupByCode(
        string? code,
        AptoDbContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code))
            return Results.BadRequest(new { error = "code is required." });

        var trimmed = code.Trim();
        var aptoNormalized = trimmed.ToUpperInvariant();

        var byApto = await db.Assets.AsNoTracking()
            .Include(a => a.PartNumber)
            .Include(a => a.Job)
            .Include(a => a.Location)
            .Where(a => a.AptoId.ToUpper() == aptoNormalized)
            .ToListAsync(ct);

        if (byApto.Count == 1)
            return Results.Ok(ToLookupResponse(byApto[0]));

        var bySerial = await db.Assets.AsNoTracking()
            .Include(a => a.PartNumber)
            .Include(a => a.Job)
            .Include(a => a.Location)
            .Where(a => a.SerialNumber != null
                        && a.SerialNumber.ToUpper() == trimmed.ToUpperInvariant())
            .ToListAsync(ct);

        if (bySerial.Count == 0)
            return Results.NotFound(new { error = "no asset found for that code." });

        if (bySerial.Count > 1)
            return Results.Conflict(new
            {
                error = $"ambiguous serial: {bySerial.Count} assets share this serial.",
                ambiguousCount = bySerial.Count,
            });

        return Results.Ok(ToLookupResponse(bySerial[0]));
    }

    private static async Task<IResult> ListInventory(
        string? q,
        Guid? accountId,
        string? facilityCode,
        Guid? jobId,
        AptoDbContext db,
        CancellationToken ct)
    {
        var query = db.Assets.AsNoTracking()
            .Include(a => a.PartNumber)
            .Include(a => a.Job)
            .ThenInclude(j => j.Account)
            .Include(a => a.Location)
            .AsQueryable();

        if (jobId is { } jid)
            query = query.Where(a => a.JobId == jid);

        if (accountId is { } aid)
            query = query.Where(a => a.Job.AccountId == aid);

        if (!string.IsNullOrWhiteSpace(facilityCode))
        {
            var fc = facilityCode.Trim().ToUpperInvariant();
            query = query.Where(a => a.Job.FacilityCode != null
                && a.Job.FacilityCode.ToUpper() == fc);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(a =>
                (a.SerialNumber != null && a.SerialNumber.ToLower().Contains(term))
                || (a.PartNumber != null && a.PartNumber.Number.ToLower().Contains(term))
                || a.AptoId.ToLower().Contains(term));
        }

        var rows = await query
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(200)
            .Select(a => new AssetInventoryRow(
                a.Id,
                a.AptoId,
                a.JobId,
                a.SerialNumber,
                a.PartNumber != null ? a.PartNumber.Number : null,
                a.Grade,
                a.Status,
                a.LocationId,
                a.Location != null ? a.Location.Name : null,
                a.Job.Account.Name,
                a.Job.FacilityCode,
                a.CreatedAtUtc))
            .ToListAsync(ct);

        return Results.Ok(rows);
    }

    private static async Task<IResult> ListForJob(Guid jobId, AptoDbContext db, CancellationToken ct)
    {
        if (!await db.Jobs.AsNoTracking().AnyAsync(j => j.Id == jobId, ct))
            return Results.NotFound();

        var assets = await db.Assets.AsNoTracking()
            .Include(a => a.PartNumber)
            .Include(a => a.Location)
            .Where(a => a.JobId == jobId)
            .OrderBy(a => a.CreatedAtUtc)
            .ToListAsync(ct);

        var responses = assets.Select(a => ToResponse(a, [])).ToList();
        return Results.Ok(responses);
    }

    private static async Task<IResult> CreateForJob(
        Guid jobId,
        AssetWriteRequest request,
        HttpContext http,
        AptoDbContext db,
        CancellationToken ct)
    {
        if (!AssetValidation.TryValidateCreate(request, out var error))
            return Results.BadRequest(new { error });

        var job = await db.Jobs.AsNoTracking().FirstOrDefaultAsync(j => j.Id == jobId, ct);
        if (job is null)
            return Results.NotFound();

        var partNumberId = await ResolvePartNumberIdAsync(request, db, ct);
        if (partNumberId is null)
            return Results.BadRequest(new { error = "part number not found." });

        if (request.Grade is not null)
        {
            var (ok, gradeError, _) = await AssetReferenceValidation.ValidateGradeAsync(db, request.Grade, ct);
            if (!ok)
                return Results.BadRequest(new { error = gradeError });
        }

        if (request.Status is not null)
        {
            var (ok, statusError, _) = await AssetReferenceValidation.ValidateStatusAsync(db, request.Status, ct);
            if (!ok)
                return Results.BadRequest(new { error = statusError });
        }

        if (request.LocationId is { } locId)
        {
            var (ok, locError, _) = await AssetReferenceValidation.ValidateLocationAsync(
                db, locId, job.FacilityCode, ct);
            if (!ok)
                return Results.BadRequest(new { error = locError });
        }

        var user = DemoUser(http);
        var serial = request.SerialNumber?.Trim();
        var aptoId = await AptoIdAllocator.AllocateNextAsync(db, ct);

        var asset = new Asset
        {
            Id = Guid.NewGuid(),
            AptoId = aptoId,
            JobId = jobId,
            PartNumberId = partNumberId,
            SerialNumber = string.IsNullOrEmpty(serial) ? null : serial,
            Grade = request.Grade?.Trim(),
            Status = request.Status?.Trim(),
            LocationId = request.LocationId,
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.Assets.Add(asset);
        AppendLog(db, asset.Id, user, "created", null, "asset");
        if (!string.IsNullOrEmpty(serial))
            AppendLog(db, asset.Id, user, "serialNumber", null, serial);
        if (partNumberId is not null)
        {
            var pn = await db.PartNumbers.AsNoTracking()
                .FirstAsync(p => p.Id == partNumberId, ct);
            AppendLog(db, asset.Id, user, "partNumber", null, pn.Number);
        }

        if (request.Grade is not null)
        {
            var (_, _, display) = await AssetReferenceValidation.ValidateGradeAsync(db, request.Grade, ct);
            AppendLog(db, asset.Id, user, "grade", null, display ?? request.Grade.Trim());
        }

        if (request.Status is not null)
        {
            var (_, _, display) = await AssetReferenceValidation.ValidateStatusAsync(db, request.Status, ct);
            AppendLog(db, asset.Id, user, "status", null, display ?? request.Status.Trim());
        }

        if (request.LocationId is { } createLocId)
        {
            var (_, _, locName) = await AssetReferenceValidation.ValidateLocationAsync(
                db, createLocId, job.FacilityCode, ct);
            AppendLog(db, asset.Id, user, "location", null, locName);
        }

        await db.SaveChangesAsync(ct);

        await db.Entry(asset).Reference(a => a.PartNumber).LoadAsync(ct);
        await db.Entry(asset).Reference(a => a.Location).LoadAsync(ct);
        var logs = await LoadChangeLogAsync(asset.Id, db, ct);
        return Results.Created($"/api/assets/{asset.Id}", ToResponse(asset, logs));
    }

    private static async Task<IResult> GetAsset(Guid id, AptoDbContext db, CancellationToken ct)
    {
        var asset = await db.Assets.AsNoTracking()
            .Include(a => a.PartNumber)
            .Include(a => a.Location)
            .FirstOrDefaultAsync(a => a.Id == id, ct);
        if (asset is null)
            return Results.NotFound();

        var logs = await LoadChangeLogAsync(id, db, ct);
        return Results.Ok(ToResponse(asset, logs));
    }

    private static async Task<IResult> UpdateAsset(
        Guid id,
        AssetWriteRequest request,
        HttpContext http,
        AptoDbContext db,
        CancellationToken ct)
    {
        if (!AssetValidation.TryValidateUpdate(request, out var error))
            return Results.BadRequest(new { error });

        var asset = await db.Assets.Include(a => a.PartNumber)
            .Include(a => a.Job)
            .Include(a => a.Location)
            .FirstOrDefaultAsync(a => a.Id == id, ct);
        if (asset is null)
            return Results.NotFound();

        var user = DemoUser(http);
        var changed = false;

        if (request.SerialNumber is not null)
        {
            var newSerial = request.SerialNumber.Trim();
            var normalized = string.IsNullOrEmpty(newSerial) ? null : newSerial;
            if (asset.SerialNumber != normalized)
            {
                AppendLog(db, asset.Id, user, "serialNumber", asset.SerialNumber, normalized);
                asset.SerialNumber = normalized;
                changed = true;
            }
        }

        if (request.PartNumberId is not null || !string.IsNullOrWhiteSpace(request.NewPartNumber))
        {
            var newPartId = await ResolvePartNumberIdAsync(request, db, ct);
            if (newPartId is null)
                return Results.BadRequest(new { error = "part number not found." });

            if (asset.PartNumberId != newPartId)
            {
                var oldNumber = asset.PartNumber?.Number;
                var newNumber = await db.PartNumbers.AsNoTracking()
                    .Where(p => p.Id == newPartId)
                    .Select(p => p.Number)
                    .FirstAsync(ct);
                AppendLog(db, asset.Id, user, "partNumber", oldNumber, newNumber);
                asset.PartNumberId = newPartId;
                changed = true;
            }
        }

        if (request.Grade is not null)
        {
            var normalized = string.IsNullOrWhiteSpace(request.Grade) ? null : request.Grade.Trim();
            if (normalized is not null)
            {
                var (ok, gradeError, display) = await AssetReferenceValidation.ValidateGradeAsync(
                    db, normalized, ct);
                if (!ok)
                    return Results.BadRequest(new { error = gradeError });

                if (!string.Equals(asset.Grade, normalized, StringComparison.OrdinalIgnoreCase))
                {
                    var oldDisplay = await ResolveGradeDisplayAsync(db, asset.Grade, ct);
                    AppendLog(db, asset.Id, user, "grade", oldDisplay, display ?? normalized);
                    asset.Grade = normalized;
                    changed = true;
                }
            }
            else if (asset.Grade is not null)
            {
                var oldDisplay = await ResolveGradeDisplayAsync(db, asset.Grade, ct);
                AppendLog(db, asset.Id, user, "grade", oldDisplay, null);
                asset.Grade = null;
                changed = true;
            }
        }

        if (request.Status is not null)
        {
            var normalized = string.IsNullOrWhiteSpace(request.Status) ? null : request.Status.Trim();
            if (normalized is not null)
            {
                var (ok, statusError, display) = await AssetReferenceValidation.ValidateStatusAsync(
                    db, normalized, ct);
                if (!ok)
                    return Results.BadRequest(new { error = statusError });

                if (!string.Equals(asset.Status, normalized, StringComparison.OrdinalIgnoreCase))
                {
                    var oldDisplay = await ResolveStatusDisplayAsync(db, asset.Status, ct);
                    AppendLog(db, asset.Id, user, "status", oldDisplay, display ?? normalized);
                    asset.Status = normalized;
                    changed = true;
                }
            }
            else if (asset.Status is not null)
            {
                var oldDisplay = await ResolveStatusDisplayAsync(db, asset.Status, ct);
                AppendLog(db, asset.Id, user, "status", oldDisplay, null);
                asset.Status = null;
                changed = true;
            }
        }

        if (request.LocationId is not null)
        {
            var targetId = request.LocationId.Value == Guid.Empty ? (Guid?)null : request.LocationId;
            if (targetId is { } locId)
            {
                var (ok, locError, locName) = await AssetReferenceValidation.ValidateLocationAsync(
                    db, locId, asset.Job.FacilityCode, ct);
                if (!ok)
                    return Results.BadRequest(new { error = locError });

                if (asset.LocationId != locId)
                {
                    var oldName = asset.Location?.Name
                        ?? await ResolveLocationNameAsync(db, asset.LocationId, ct);
                    AppendLog(db, asset.Id, user, "location", oldName, locName);
                    asset.LocationId = locId;
                    changed = true;
                }
            }
            else if (asset.LocationId is not null)
            {
                var oldName = asset.Location?.Name
                    ?? await ResolveLocationNameAsync(db, asset.LocationId, ct);
                AppendLog(db, asset.Id, user, "location", oldName, null);
                asset.LocationId = null;
                changed = true;
            }
        }

        if (!changed)
            return Results.BadRequest(new { error = "no changes supplied." });

        await db.SaveChangesAsync(ct);
        await db.Entry(asset).Reference(a => a.PartNumber).LoadAsync(ct);
        await db.Entry(asset).Reference(a => a.Location).LoadAsync(ct);
        var logs = await LoadChangeLogAsync(asset.Id, db, ct);
        return Results.Ok(ToResponse(asset, logs));
    }

    private static async Task<Guid?> ResolvePartNumberIdAsync(
        AssetWriteRequest request,
        AptoDbContext db,
        CancellationToken ct)
    {
        if (request.PartNumberId is { } pid)
        {
            var exists = await db.PartNumbers.AsNoTracking().AnyAsync(p => p.Id == pid, ct);
            return exists ? pid : null;
        }

        if (string.IsNullOrWhiteSpace(request.NewPartNumber))
            return null;

        var number = request.NewPartNumber.Trim();
        var existing = await db.PartNumbers.FirstOrDefaultAsync(p => p.Number == number, ct);
        if (existing is not null)
            return existing.Id;

        var part = new PartNumber { Id = Guid.NewGuid(), Number = number };
        db.PartNumbers.Add(part);
        await db.SaveChangesAsync(ct);
        return part.Id;
    }

    private static async Task<string?> ResolveGradeDisplayAsync(
        AptoDbContext db,
        string? code,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;
        var item = await db.ReferenceItems.AsNoTracking()
            .FirstOrDefaultAsync(
                r => r.Type == ReferenceData.ReferenceTypes.Grade
                     && r.Code.ToUpper() == code.ToUpper(),
                ct);
        return item?.Name ?? code;
    }

    private static async Task<string?> ResolveStatusDisplayAsync(
        AptoDbContext db,
        string? code,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;
        var item = await db.ReferenceItems.AsNoTracking()
            .FirstOrDefaultAsync(
                r => r.Type == ReferenceData.ReferenceTypes.AssetStatus
                     && r.Code.ToUpper() == code.ToUpper(),
                ct);
        return item?.Name ?? code;
    }

    private static async Task<string?> ResolveLocationNameAsync(
        AptoDbContext db,
        Guid? locationId,
        CancellationToken ct)
    {
        if (locationId is null)
            return null;
        return await db.ReferenceItems.AsNoTracking()
            .Where(r => r.Id == locationId)
            .Select(r => r.Name)
            .FirstOrDefaultAsync(ct);
    }

    private static void AppendLog(
        AptoDbContext db,
        Guid assetId,
        string user,
        string field,
        string? oldValue,
        string? newValue)
    {
        db.AssetChangeLogs.Add(new AssetChangeLog
        {
            Id = Guid.NewGuid(),
            AssetId = assetId,
            FieldName = field,
            OldValue = oldValue,
            NewValue = newValue,
            ChangedBy = user,
            ChangedAtUtc = DateTime.UtcNow,
        });
    }

    private static async Task<List<AssetChangeLogEntry>> LoadChangeLogAsync(
        Guid assetId,
        AptoDbContext db,
        CancellationToken ct)
    {
        return await db.AssetChangeLogs.AsNoTracking()
            .Where(l => l.AssetId == assetId)
            .OrderByDescending(l => l.ChangedAtUtc)
            .Select(l => new AssetChangeLogEntry(
                l.FieldName,
                l.OldValue,
                l.NewValue,
                l.ChangedBy,
                l.ChangedAtUtc))
            .ToListAsync(ct);
    }

    private static AssetLookupResponse ToLookupResponse(Asset asset) =>
        new(
            asset.Id,
            asset.AptoId,
            asset.SerialNumber,
            asset.JobId,
            asset.Job.FacilityCode,
            asset.Grade,
            asset.Status,
            asset.LocationId,
            asset.Location?.Name,
            asset.PartNumber?.Number);

    private static AssetResponse ToResponse(Asset asset, IReadOnlyList<AssetChangeLogEntry> changeLog) =>
        new(
            asset.Id,
            asset.AptoId,
            asset.JobId,
            asset.PartNumberId,
            asset.PartNumber?.Number,
            asset.SerialNumber,
            asset.Grade,
            asset.Status,
            asset.LocationId,
            asset.Location?.Name,
            asset.CreatedAtUtc,
            changeLog);

    private static string DemoUser(HttpContext http) =>
        http.Request.Headers.TryGetValue("X-Apto-User", out var values)
        && !string.IsNullOrWhiteSpace(values.ToString())
            ? values.ToString().Trim()
            : "demo";
}
