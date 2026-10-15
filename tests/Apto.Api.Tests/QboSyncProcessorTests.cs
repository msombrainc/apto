using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.QuickBooks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Apto.Api.Tests;

public class QboSyncProcessorTests
{
    [Fact]
    public async Task ProcessNext_processes_oldest_pending_first()
    {
        var callOrder = new List<string>();
        await using var factory = CreateFactory((payload, _) =>
        {
            callOrder.Add(payload.DisplayName);
            return Task.FromResult(new QboSyncResult(QboSyncStatus.Synced, "qbo-1", null));
        });

        var olderId = Guid.NewGuid();
        var newerId = Guid.NewGuid();
        await SeedConnectionAndRowsAsync(factory, olderId, newerId);

        await using var scope = factory.Services.CreateAsyncScope();
        var processor = scope.ServiceProvider.GetRequiredService<QboSyncRequestProcessor>();
        Assert.True(await processor.ProcessNextAsync(CancellationToken.None));
        Assert.True(await processor.ProcessNextAsync(CancellationToken.None));

        Assert.Equal(new[] { "Old", "New" }, callOrder);

        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var older = await db.QboSyncRequests.AsNoTracking().SingleAsync(r => r.Id == olderId);
        var newer = await db.QboSyncRequests.AsNoTracking().SingleAsync(r => r.Id == newerId);
        Assert.Equal(QboSyncRequestStatus.Sent, older.Status);
        Assert.Equal(QboSyncRequestStatus.Sent, newer.Status);
    }

    [Fact]
    public async Task ProcessNext_marks_failed_after_five_attempts()
    {
        await using var factory = CreateFactory((_, _) =>
            Task.FromResult(new QboSyncResult(QboSyncStatus.Failed, null, "duplicate name")));

        var rowId = Guid.NewGuid();
        await SeedConnectionAndRowsAsync(factory, rowId);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var processor = scope.ServiceProvider.GetRequiredService<QboSyncRequestProcessor>();

        for (var i = 0; i < 5; i++)
        {
            var row = await db.QboSyncRequests.SingleAsync(r => r.Id == rowId);
            row.UpdatedAtUtc = DateTime.UtcNow.AddHours(-1);
            await db.SaveChangesAsync();
            Assert.True(await processor.ProcessNextAsync(CancellationToken.None));
        }

        var final = await db.QboSyncRequests.AsNoTracking().SingleAsync(r => r.Id == rowId);
        Assert.Equal(QboSyncRequestStatus.Failed, final.Status);
        Assert.Equal(5, final.Attempts);
        Assert.Equal("duplicate name", final.LastError);
    }

    private static AptoWebApplicationFactory CreateFactory(
        Func<QboCustomerPayload, CancellationToken, Task<QboSyncResult>> onCreate)
    {
        return new AptoWebApplicationFactory(
            o =>
            {
                o.ClientId = "c";
                o.ClientSecret = "s";
                o.RedirectUri = "http://localhost/callback";
            },
            services =>
            {
                services.AddSingleton<IQboCustomerSyncService>(new StubQboCustomerSync(onCreate));
            });
    }

    private static async Task SeedConnectionAndRowsAsync(
        AptoWebApplicationFactory factory,
        Guid olderId,
        Guid? newerId = null)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        db.QboConnections.Add(new QboConnection
        {
            Id = QboConnection.SingletonId,
            RealmId = "realm",
            AccessToken = "tok",
            RefreshToken = "ref",
            AccessTokenExpiresAtUtc = DateTime.UtcNow.AddHours(1),
            UpdatedAtUtc = DateTime.UtcNow,
        });

        var baseTime = DateTime.UtcNow.AddMinutes(-10);
        db.QboSyncRequests.Add(new QboSyncRequest
        {
            Id = olderId,
            Operation = QboSyncOperations.CreateCustomer,
            EntityType = QboSyncEntityTypes.Account,
            EntityId = Guid.NewGuid(),
            PayloadJson = """{"DisplayName":"Old","CompanyName":"Old Co"}""",
            Status = QboSyncRequestStatus.Pending,
            Attempts = 0,
            CreatedAtUtc = baseTime,
            UpdatedAtUtc = baseTime,
        });

        if (newerId is Guid newer)
        {
            db.QboSyncRequests.Add(new QboSyncRequest
            {
                Id = newer,
                Operation = QboSyncOperations.CreateCustomer,
                EntityType = QboSyncEntityTypes.Account,
                EntityId = Guid.NewGuid(),
                PayloadJson = """{"DisplayName":"New","CompanyName":"New Co"}""",
                Status = QboSyncRequestStatus.Pending,
                Attempts = 0,
                CreatedAtUtc = baseTime.AddMinutes(5),
                UpdatedAtUtc = baseTime.AddMinutes(5),
            });
        }

        await db.SaveChangesAsync();
    }

    private sealed class StubQboCustomerSync(Func<QboCustomerPayload, CancellationToken, Task<QboSyncResult>> onCreate)
        : IQboCustomerSyncService
    {
        public Task<QboSyncResult> SyncAccountCustomerAsync(Account account, CancellationToken ct) =>
            Task.FromResult(new QboSyncResult(QboSyncStatus.Skipped, null, null));

        public Task<QboSyncResult> CreateCustomerAsync(QboCustomerPayload payload, CancellationToken ct) =>
            onCreate(payload, ct);

        public Task<QboSyncResult> UpdateCustomerAsync(
            string qboCustomerId,
            QboCustomerPayload payload,
            CancellationToken ct) =>
            Task.FromResult(new QboSyncResult(QboSyncStatus.Synced, qboCustomerId, null));
    }
}
