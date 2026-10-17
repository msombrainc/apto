using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.ReferenceData;

public static class ReferenceItemEndpoints
{
    private static readonly string[] AllowedAssetGroups = ["WIP", "Finished", "Exception"];
    private static readonly string[] AllowedCertGroups = ["Recycled", "Wiped", "Shredded"];

    public static RouteGroupBuilder MapReferenceItemEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/reference");

        group.MapGet("/{type}", ListReferenceItems);
        group.MapPost("/{type}", CreateReferenceItem);
        group.MapPut("/{type}/{id:guid}", UpdateReferenceItem);
        group.MapDelete("/{type}/{id:guid}", DeleteReferenceItem);

        return group;
    }

    public static async Task<IReadOnlyList<string>> GetActiveFacilityCodesAsync(
        AptoDbContext db,
        CancellationToken ct)
    {
        return await db.ReferenceItems.AsNoTracking()
            .Where(r => r.Type == ReferenceTypes.Facility && r.IsActive)
            .OrderBy(r => r.SortOrder)
            .ThenBy(r => r.Name)
            .Select(r => r.Code.ToUpper())
            .ToListAsync(ct);
    }

    public static async Task<IReadOnlyList<ReferenceItem>> GetActiveJobStatusesAsync(
        AptoDbContext db,
        CancellationToken ct)
    {
        return await db.ReferenceItems.AsNoTracking()
            .Where(r => r.Type == ReferenceTypes.JobStatus && r.IsActive)
            .OrderBy(r => r.SortOrder)
            .ThenBy(r => r.Name)
            .ToListAsync(ct);
    }

    private static async Task<IResult> ListReferenceItems(
        string type,
        string? q,
        int? page,
        int? pageSize,
        bool? includeInactive,
        Guid? facilityId,
        string? sortBy,
        string? sortDir,
        AptoDbContext db,
        CancellationToken ct)
    {
        var normalizedType = type.Trim().ToLowerInvariant();
        if (!ReferenceTypes.IsKnown(normalizedType))
            return BadType(normalizedType);

        if (normalizedType == ReferenceTypes.Location && facilityId is null)
            return Results.BadRequest(new { error = "facilityId is required for location lists." });

        var pg = Math.Max(1, page ?? 1);
        var size = Math.Clamp(pageSize ?? 50, 1, 200);
        var showInactive = includeInactive == true;

        var query = db.ReferenceItems.AsNoTracking().Where(r => r.Type == normalizedType);
        if (!showInactive)
            query = query.Where(r => r.IsActive);

        if (normalizedType == ReferenceTypes.Location && facilityId is { } fid)
            query = query.Where(r => r.ParentId == fid);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(r =>
                r.Code.ToLower().Contains(term) || r.Name.ToLower().Contains(term));
        }

        var descending = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        var sortKey = (sortBy ?? "sortOrder").Trim().ToLowerInvariant();
        query = sortKey switch
        {
            "code" => descending ? query.OrderByDescending(r => r.Code) : query.OrderBy(r => r.Code),
            "name" => descending ? query.OrderByDescending(r => r.Name) : query.OrderBy(r => r.Name),
            _ => descending
                ? query.OrderByDescending(r => r.SortOrder).ThenByDescending(r => r.Name)
                : query.OrderBy(r => r.SortOrder).ThenBy(r => r.Name),
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip((pg - 1) * size).Take(size).ToListAsync(ct);

        var parentMap = await LoadParentMapAsync(db, rows, ct);
        var items = new List<ReferenceItemResponse>();
        foreach (var row in rows)
        {
            var inUse = await ReferenceInUseCounter.CountAsync(db, row, ct);
            items.Add(ToResponse(row, parentMap, inUse));
        }

        return Results.Ok(new ReferenceListResponse(items, pg, size, total));
    }

    private static async Task<IResult> CreateReferenceItem(
        string type,
        ReferenceWriteRequest request,
        AptoDbContext db,
        CancellationToken ct)
    {
        var normalizedType = type.Trim().ToLowerInvariant();
        if (!ReferenceTypes.IsKnown(normalizedType))
            return BadType(normalizedType);

        if (!TryValidateWrite(normalizedType, request, out var error))
            return Results.BadRequest(new { error });

        var code = request.Code.Trim();
        if (!await IsCodeUniqueAsync(db, normalizedType, code, request.ParentId, excludeId: null, ct))
            return Results.BadRequest(new { error = "code already exists for this type." });

        if (normalizedType == ReferenceTypes.Location)
        {
            var parentOk = await db.ReferenceItems.AsNoTracking()
                .AnyAsync(
                    r => r.Id == request.ParentId
                         && r.Type == ReferenceTypes.Facility
                         && r.IsActive,
                    ct);
            if (!parentOk)
                return Results.BadRequest(new { error = "parent facility is invalid or inactive." });
        }

        var now = DateTime.UtcNow;
        var entity = new ReferenceItem
        {
            Id = Guid.NewGuid(),
            Type = normalizedType,
            Code = normalizedType == ReferenceTypes.Facility
                ? code.ToUpperInvariant()
                : code,
            Name = request.Name.Trim(),
            ParentId = normalizedType == ReferenceTypes.Location ? request.ParentId : null,
            Group = normalizedType == ReferenceTypes.AssetStatus ? request.Group?.Trim() : null,
            CertificateGroup = normalizedType == ReferenceTypes.AssetStatus
                ? string.IsNullOrWhiteSpace(request.CertificateGroup)
                    ? null
                    : request.CertificateGroup.Trim()
                : null,
            SortOrder = request.SortOrder,
            IsActive = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        db.ReferenceItems.Add(entity);
        await db.SaveChangesAsync(ct);

        var parentMap = await LoadParentMapAsync(db, [entity], ct);
        var inUse = await ReferenceInUseCounter.CountAsync(db, entity, ct);
        return Results.Created(
            $"/api/reference/{normalizedType}/{entity.Id}",
            ToResponse(entity, parentMap, inUse));
    }

    private static async Task<IResult> UpdateReferenceItem(
        string type,
        Guid id,
        ReferenceWriteRequest request,
        AptoDbContext db,
        CancellationToken ct)
    {
        var normalizedType = type.Trim().ToLowerInvariant();
        if (!ReferenceTypes.IsKnown(normalizedType))
            return BadType(normalizedType);

        var entity = await db.ReferenceItems.FirstOrDefaultAsync(
            r => r.Id == id && r.Type == normalizedType,
            ct);
        if (entity is null)
            return Results.NotFound();

        if (!TryValidateWrite(normalizedType, request, out var error))
            return Results.BadRequest(new { error });

        var code = request.Code.Trim();
        if (!await IsCodeUniqueAsync(db, normalizedType, code, request.ParentId, excludeId: id, ct))
            return Results.BadRequest(new { error = "code already exists for this type." });

        var normalizedNewCode = normalizedType == ReferenceTypes.Facility
            ? code.ToUpperInvariant()
            : code;
        var normalizedOldCode = normalizedType == ReferenceTypes.Facility
            ? entity.Code.Trim().ToUpperInvariant()
            : entity.Code.Trim();
        if (!string.Equals(normalizedNewCode, normalizedOldCode, StringComparison.Ordinal))
        {
            var inUseBefore = await ReferenceInUseCounter.CountAsync(db, entity, ct);
            if (inUseBefore > 0)
                return Results.BadRequest(new { error = "code cannot change while reference is in use." });
        }

        if (normalizedType == ReferenceTypes.Location)
        {
            var parentOk = await db.ReferenceItems.AsNoTracking()
                .AnyAsync(
                    r => r.Id == request.ParentId
                         && r.Type == ReferenceTypes.Facility
                         && r.IsActive,
                    ct);
            if (!parentOk)
                return Results.BadRequest(new { error = "parent facility is invalid or inactive." });
        }

        entity.Code = normalizedType == ReferenceTypes.Facility
            ? code.ToUpperInvariant()
            : code;
        entity.Name = request.Name.Trim();
        entity.SortOrder = request.SortOrder;
        entity.ParentId = normalizedType == ReferenceTypes.Location ? request.ParentId : entity.ParentId;
        if (normalizedType == ReferenceTypes.AssetStatus)
        {
            entity.Group = request.Group?.Trim();
            entity.CertificateGroup = string.IsNullOrWhiteSpace(request.CertificateGroup)
                ? null
                : request.CertificateGroup.Trim();
        }

        if (request.IsActive is { } active)
            entity.IsActive = active;

        entity.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var parentMap = await LoadParentMapAsync(db, [entity], ct);
        var inUse = await ReferenceInUseCounter.CountAsync(db, entity, ct);
        return Results.Ok(ToResponse(entity, parentMap, inUse));
    }

    private static async Task<IResult> DeleteReferenceItem(
        string type,
        Guid id,
        AptoDbContext db,
        CancellationToken ct)
    {
        var normalizedType = type.Trim().ToLowerInvariant();
        if (!ReferenceTypes.IsKnown(normalizedType))
            return BadType(normalizedType);

        var entity = await db.ReferenceItems.FirstOrDefaultAsync(
            r => r.Id == id && r.Type == normalizedType,
            ct);
        if (entity is null)
            return Results.NotFound();

        var inUse = await ReferenceInUseCounter.CountAsync(db, entity, ct);
        if (inUse > 0)
        {
            entity.IsActive = false;
            entity.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            var parentMap = await LoadParentMapAsync(db, [entity], ct);
            return Results.Ok(ToResponse(entity, parentMap, inUse));
        }

        db.ReferenceItems.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static IResult BadType(string type) =>
        Results.BadRequest(new
        {
            error =
                $"Unknown reference type '{type}'. Allowed: {string.Join(", ", ReferenceTypes.All)}.",
        });

    private static bool TryValidateWrite(
        string type,
        ReferenceWriteRequest request,
        out string? error)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Trim().Length > 32)
        {
            error = "code is required (max 32 characters).";
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 128)
        {
            error = "name is required (max 128 characters).";
            return false;
        }

        if (request.SortOrder < 0)
        {
            error = "sortOrder must be 0 or greater.";
            return false;
        }

        if (type == ReferenceTypes.Location && request.ParentId is null)
        {
            error = "parentId (facility) is required for locations.";
            return false;
        }

        if (type == ReferenceTypes.AssetStatus)
        {
            var group = request.Group?.Trim();
            if (string.IsNullOrWhiteSpace(group) || !AllowedAssetGroups.Contains(group))
            {
                error = "group is required and must be WIP, Finished, or Exception.";
                return false;
            }

            if (!string.IsNullOrWhiteSpace(request.CertificateGroup))
            {
                var cert = request.CertificateGroup.Trim();
                if (!AllowedCertGroups.Contains(cert))
                {
                    error = "certificateGroup must be Recycled, Wiped, or Shredded.";
                    return false;
                }
            }
        }

        error = null;
        return true;
    }

    private static async Task<bool> IsCodeUniqueAsync(
        AptoDbContext db,
        string type,
        string code,
        Guid? parentId,
        Guid? excludeId,
        CancellationToken ct)
    {
        var normalized = code.Trim().ToLowerInvariant();
        var query = db.ReferenceItems.AsNoTracking().Where(r => r.Type == type);

        if (type == ReferenceTypes.Location)
            query = query.Where(r => r.ParentId == parentId);
        else
            query = query.Where(r => r.ParentId == null);

        if (excludeId is { } eid)
            query = query.Where(r => r.Id != eid);

        return !await query.AnyAsync(r => r.Code.ToLower() == normalized, ct);
    }

    private static async Task<Dictionary<Guid, ReferenceItem>> LoadParentMapAsync(
        AptoDbContext db,
        IReadOnlyList<ReferenceItem> rows,
        CancellationToken ct)
    {
        var parentIds = rows
            .Where(r => r.ParentId is not null)
            .Select(r => r.ParentId!.Value)
            .Distinct()
            .ToList();
        if (parentIds.Count == 0)
            return new Dictionary<Guid, ReferenceItem>();

        var parents = await db.ReferenceItems.AsNoTracking()
            .Where(r => parentIds.Contains(r.Id))
            .ToListAsync(ct);
        return parents.ToDictionary(p => p.Id);
    }

    private static ReferenceItemResponse ToResponse(
        ReferenceItem row,
        IReadOnlyDictionary<Guid, ReferenceItem> parentMap,
        int inUseCount)
    {
        string? parentCode = null;
        string? parentName = null;
        if (row.ParentId is { } pid && parentMap.TryGetValue(pid, out var parent))
        {
            parentCode = parent.Code;
            parentName = parent.Name;
        }

        return new ReferenceItemResponse(
            row.Id,
            row.Type,
            row.Code,
            row.Name,
            row.ParentId,
            parentCode,
            parentName,
            row.Group,
            row.CertificateGroup,
            row.SortOrder,
            row.IsActive,
            inUseCount);
    }
}
