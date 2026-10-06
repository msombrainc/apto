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
        await using var db = await CreateSqliteContextAsync();

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

    [Fact]
    public async Task DbContext_rejects_duplicate_category_name()
    {
        await using var db = await CreateSqliteContextAsync();
        db.Add(new Category { Id = Guid.NewGuid(), Name = "Handsets" });
        await db.SaveChangesAsync();
        db.Add(new Category { Id = Guid.NewGuid(), Name = "Handsets" });
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    [Fact]
    public async Task DbContext_rejects_duplicate_part_number()
    {
        await using var db = await CreateSqliteContextAsync();
        db.Add(new PartNumber { Id = Guid.NewGuid(), Number = "PN-100" });
        await db.SaveChangesAsync();
        db.Add(new PartNumber { Id = Guid.NewGuid(), Number = "PN-100" });
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    private static async Task<AptoDbContext> CreateSqliteContextAsync()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AptoDbContext>()
            .UseSqlite(connection)
            .Options;
        var db = new AptoDbContext(options);
        await db.Database.EnsureCreatedAsync();
        return db;
    }
}
