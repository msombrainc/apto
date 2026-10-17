using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Data;

public static class UnidentifiedPartSeeder
{
    public const string UnidentifiedNumber = "UNIDENTIFIED";

    public static async Task SeedIfMissingAsync(AptoDbContext db, CancellationToken ct = default)
    {
        var exists = await db.PartNumbers.AsNoTracking()
            .AnyAsync(p => p.Number == UnidentifiedNumber, ct);
        if (exists)
            return;

        db.PartNumbers.Add(new PartNumber
        {
            Id = Guid.NewGuid(),
            Number = UnidentifiedNumber,
        });
        await db.SaveChangesAsync(ct);
    }
}
