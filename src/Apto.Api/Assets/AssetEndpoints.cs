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
        group.MapGet("/assets/{id:guid}", GetAsset);
        group.MapPut("/assets/{id:guid}", UpdateAsset);
        return group;
    }

    private static async Task<IResult> ListForJob(Guid jobId, AptoDbContext db, CancellationToken ct)
    {
        if (!await db.Jobs.AsNoTracking().AnyAsync(j => j.Id == jobId, ct))
            return Results.NotFound();

        var assets = await db.Assets.AsNoTracking()
            .Include(a => a.PartNumber)
            .Where(a => a.JobId == jobId)
            .OrderBy(a => a.CreatedAtUtc)
            .ToListAsync(ct);

        // List omits change logs; clients load GET /api/assets/{id} after row select.
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

        var user = DemoUser(http);
        var serial = request.SerialNumber?.Trim();

        var asset = new Asset
        {
            Id = Guid.NewGuid(),
            JobId = jobId,
            PartNumberId = partNumberId,
            SerialNumber = string.IsNullOrEmpty(serial) ? null : serial,
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

        await db.SaveChangesAsync(ct);

        await db.Entry(asset).Reference(a => a.PartNumber).LoadAsync(ct);
        var logs = await LoadChangeLogAsync(asset.Id, db, ct);
        return Results.Created($"/api/assets/{asset.Id}", ToResponse(asset, logs));
    }

    private static async Task<IResult> GetAsset(Guid id, AptoDbContext db, CancellationToken ct)
    {
        var asset = await db.Assets.AsNoTracking()
            .Include(a => a.PartNumber)
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

        if (!changed)
            return Results.BadRequest(new { error = "no changes supplied." });

        await db.SaveChangesAsync(ct);
        await db.Entry(asset).Reference(a => a.PartNumber).LoadAsync(ct);
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

    private static AssetResponse ToResponse(Asset asset, IReadOnlyList<AssetChangeLogEntry> changeLog) =>
        new(
            asset.Id,
            asset.JobId,
            asset.PartNumberId,
            asset.PartNumber?.Number,
            asset.SerialNumber,
            asset.CreatedAtUtc,
            changeLog);

    private static string DemoUser(HttpContext http) =>
        http.Request.Headers.TryGetValue("X-Apto-User", out var values)
        && !string.IsNullOrWhiteSpace(values.ToString())
            ? values.ToString().Trim()
            : "demo";
}
