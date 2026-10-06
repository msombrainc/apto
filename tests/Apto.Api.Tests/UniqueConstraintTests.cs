using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Tests;

public class UniqueConstraintTests
{
    [Fact]
    public async Task DbContext_rejects_duplicate_account_code()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AptoDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new AptoDbContext(options);
        await db.Database.EnsureCreatedAsync();

        db.Add(new Account
        {
            Id = Guid.NewGuid(),
            Name = "First",
            Code = "DUP-CODE",
            CreatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        db.Add(new Account
        {
            Id = Guid.NewGuid(),
            Name = "Second",
            Code = "DUP-CODE",
            CreatedAtUtc = DateTime.UtcNow,
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }
}
