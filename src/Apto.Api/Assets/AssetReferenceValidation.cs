using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.ReferenceData;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Assets;

public static class AssetReferenceValidation
{
    public static async Task<(bool Ok, string? Error, string? DisplayName)> ValidateGradeAsync(
        AptoDbContext db,
        string gradeCode,
        CancellationToken ct)
    {
        var code = gradeCode.Trim();
        var item = await db.ReferenceItems.AsNoTracking()
            .FirstOrDefaultAsync(
                r => r.Type == ReferenceTypes.Grade
                     && r.IsActive
                     && r.Code.ToUpper() == code.ToUpper(),
                ct);
        if (item is null)
            return (false, "grade is invalid or inactive.", null);

        return (true, null, item.Name);
    }

    public static async Task<(bool Ok, string? Error, string? DisplayName)> ValidateStatusAsync(
        AptoDbContext db,
        string statusCode,
        CancellationToken ct)
    {
        var code = statusCode.Trim();
        var item = await db.ReferenceItems.AsNoTracking()
            .FirstOrDefaultAsync(
                r => r.Type == ReferenceTypes.AssetStatus
                     && r.IsActive
                     && r.Code.ToUpper() == code.ToUpper(),
                ct);
        if (item is null)
            return (false, "status is invalid or inactive.", null);

        return (true, null, item.Name);
    }

    public static async Task<(bool Ok, string? Error, string? LocationName)> ValidateLocationAsync(
        AptoDbContext db,
        Guid locationId,
        string? facilityCode,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(facilityCode))
            return (false, "asset job has no facility; location cannot be set.", null);

        var location = await db.ReferenceItems.AsNoTracking()
            .Include(r => r.Parent)
            .FirstOrDefaultAsync(
                r => r.Id == locationId && r.Type == ReferenceTypes.Location && r.IsActive,
                ct);
        if (location is null)
            return (false, "location is invalid or inactive.", null);

        if (location.Parent is null
            || location.Parent.Type != ReferenceTypes.Facility
            || !location.Parent.IsActive
            || !string.Equals(
                location.Parent.Code,
                facilityCode.Trim(),
                StringComparison.OrdinalIgnoreCase))
        {
            return (false, "location does not belong to the asset job facility.", null);
        }

        return (true, null, location.Name);
    }
}
