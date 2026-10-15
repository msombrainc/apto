using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.ReferenceData;

public static class ReferenceInUseCounter
{
    public static async Task<int> CountAsync(
        AptoDbContext db,
        ReferenceItem item,
        CancellationToken ct)
    {
        if (item.Type == ReferenceTypes.Facility)
        {
            var code = item.Code.Trim().ToUpperInvariant();
            return await db.Jobs.AsNoTracking()
                .CountAsync(j => j.FacilityCode != null && j.FacilityCode.ToUpper() == code, ct);
        }

        return 0;
    }

    public static async Task<int> CountCategoryPartNumbersAsync(
        AptoDbContext db,
        Guid categoryId,
        CancellationToken ct) =>
        await db.PartNumbers.AsNoTracking().CountAsync(p => p.CategoryId == categoryId, ct);
}
