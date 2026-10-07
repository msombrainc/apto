using Apto.Api.Data.Entities;
using Apto.Api.Jobs;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Data;

public static class DemoJobSeeder
{
    public static async Task SeedIfEmptyAsync(IServiceProvider services, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();

        if (await db.Jobs.AnyAsync(ct))
            return;

        var account = new Account
        {
            Id = Guid.NewGuid(),
            Name = "Demo SLA Account",
            Code = "DEMO-SLA",
            SlaReceivingDays = 2,
            SlaProcessingDays = 5,
            SlaShippingDays = 3,
            CreatedAtUtc = DateTime.UtcNow,
            QboSyncStatus = "skipped",
        };

        db.Accounts.Add(account);

        var today = DateTime.UtcNow.Date;
        var jobs = new[]
        {
            ("on-track", today.AddDays(10)),
            ("at-risk", today.AddDays(2)),
            ("overdue", today.AddDays(-3)),
        };

        foreach (var (ops, due) in jobs)
        {
            db.Jobs.Add(new Job
            {
                Id = Guid.NewGuid(),
                AccountId = account.Id,
                FacilityCode = "GA",
                OpsStatus = ops,
                StartDateUtc = today.AddDays(-5),
                DueDateUtc = due,
                CreatedAtUtc = DateTime.UtcNow,
            });
        }

        await db.SaveChangesAsync(ct);
    }
}
