using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Tests;

public class UnidentifiedPartSeederTests
{
    [Fact]
    public async Task SeedIfMissingAsync_adds_unidentified_once()
    {
        var options = new DbContextOptionsBuilder<AptoDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new AptoDbContext(options);

        await UnidentifiedPartSeeder.SeedIfMissingAsync(db);
        await UnidentifiedPartSeeder.SeedIfMissingAsync(db);

        var count = await db.PartNumbers.CountAsync(p => p.Number == UnidentifiedPartSeeder.UnidentifiedNumber);
        Assert.Equal(1, count);
    }
}
