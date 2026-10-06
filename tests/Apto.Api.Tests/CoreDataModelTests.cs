using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Apto.Api.Tests;

public class CoreDataModelTests
{
    [Fact]
    public async Task DbContext_persists_account_job_asset_graph()
    {
        await using var factory = new AptoWebApplicationFactory();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();

        var account = new Account
        {
            Id = Guid.NewGuid(),
            Name = "Acme Demo",
            Code = "ACME-01",
            SlaReceivingDays = 2,
            SlaProcessingDays = 5,
            SlaShippingDays = 3,
            CreatedAtUtc = DateTime.UtcNow,
        };
        var job = new Job
        {
            Id = Guid.NewGuid(),
            AccountId = account.Id,
            FacilityCode = "GA",
            OpsStatus = "Open",
            CreatedAtUtc = DateTime.UtcNow,
        };
        var category = new Category { Id = Guid.NewGuid(), Name = "Handsets" };
        var part = new PartNumber { Id = Guid.NewGuid(), Number = "PN-100", CategoryId = category.Id };
        var asset = new Asset
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            SerialNumber = "SN-1",
            PartNumberId = part.Id,
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.AddRange(account, job, category, part, asset);
        await db.SaveChangesAsync();

        var accountByCode = await db.Accounts.SingleAsync(a => a.Code == "ACME-01");
        Assert.Equal("Acme Demo", accountByCode.Name);

        var loaded = await db.Assets
            .Include(a => a.PartNumber)
            .ThenInclude(p => p!.Category)
            .Include(a => a.Job)
            .ThenInclude(j => j.Account)
            .SingleAsync(a => a.Id == asset.Id);

        Assert.Equal("ACME-01", loaded.Job.Account.Code);
        Assert.Equal("PN-100", loaded.PartNumber!.Number);
        Assert.Equal("Handsets", loaded.PartNumber.Category!.Name);
    }
}
