using System.Net;
using System.Net.Http.Json;
using Apto.Api.Accounts;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.QuickBooks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Apto.Api.Tests;

public class QboSyncEndpointsTests
{
    [Fact]
    public async Task Status_disconnected_includes_connect_url_when_configured()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "c";
            o.ClientSecret = "s";
            o.RedirectUri = "http://localhost/callback";
        });
        var client = factory.CreateClient();

        var status = await client.GetFromJsonAsync<QboStatusDto>("/api/qbo/status");
        Assert.NotNull(status);
        Assert.False(status.Connected);
        Assert.False(string.IsNullOrEmpty(status.ConnectUrl));
    }

    [Fact]
    public async Task Create_account_enqueues_without_inline_qbo_http()
    {
        var httpCalls = 0;
        await using var factory = new AptoWebApplicationFactory(
            o =>
            {
                o.ClientId = "c";
                o.ClientSecret = "s";
                o.ApiBaseUrl = "https://qbo.test";
                o.TokenUrl = "https://oauth.test/token";
            },
            onConfigureServices: services =>
            {
                services.AddSingleton<IHttpClientFactory>(new CountingHttpClientFactory(() =>
                {
                    Interlocked.Increment(ref httpCalls);
                    return new HttpResponseMessage(HttpStatusCode.NotFound);
                }));
            });

        var client = factory.CreateClient();
        var post = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Queue Co", "Q-01", 1, 1, 1));
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var created = await post.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(created);
        Assert.Equal(QboSyncStatus.Pending, created.QboSyncStatus);
        Assert.Equal(0, httpCalls);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var pending = await db.QboSyncRequests.CountAsync(r => r.Status == QboSyncRequestStatus.Pending);
        Assert.Equal(1, pending);
    }

    [Fact]
    public async Task Retry_failed_resets_to_pending()
    {
        await using var factory = new AptoWebApplicationFactory();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var row = new QboSyncRequest
        {
            Id = Guid.NewGuid(),
            Operation = QboSyncOperations.CreateCustomer,
            EntityType = QboSyncEntityTypes.Account,
            EntityId = Guid.NewGuid(),
            PayloadJson = """{"DisplayName":"X","CompanyName":"Y"}""",
            Status = QboSyncRequestStatus.Failed,
            Attempts = 5,
            LastError = "boom",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };
        db.QboSyncRequests.Add(row);
        await db.SaveChangesAsync();

        var client = factory.CreateClient();
        var retry = await client.PostAsync($"/api/qbo/requests/{row.Id}/retry", null);
        Assert.Equal(HttpStatusCode.NoContent, retry.StatusCode);

        db.ChangeTracker.Clear();
        var updated = await db.QboSyncRequests.AsNoTracking().SingleAsync(r => r.Id == row.Id);
        Assert.Equal(QboSyncRequestStatus.Pending, updated.Status);
        Assert.Equal(0, updated.Attempts);
        Assert.Null(updated.LastError);
    }

    [Fact]
    public async Task List_requests_filters_by_status()
    {
        await using var factory = new AptoWebApplicationFactory();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        db.QboSyncRequests.AddRange(
            new QboSyncRequest
            {
                Id = Guid.NewGuid(),
                Operation = QboSyncOperations.CreateCustomer,
                EntityType = QboSyncEntityTypes.Account,
                EntityId = Guid.NewGuid(),
                PayloadJson = "{}",
                Status = QboSyncRequestStatus.Failed,
                Attempts = 5,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow,
            },
            new QboSyncRequest
            {
                Id = Guid.NewGuid(),
                Operation = QboSyncOperations.CreateCustomer,
                EntityType = QboSyncEntityTypes.Account,
                EntityId = Guid.NewGuid(),
                PayloadJson = "{}",
                Status = QboSyncRequestStatus.Pending,
                Attempts = 0,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow,
            });
        await db.SaveChangesAsync();

        var client = factory.CreateClient();
        var list = await client.GetFromJsonAsync<QboListDto>("/api/qbo/requests?status=Failed");
        Assert.NotNull(list);
        Assert.Equal(1, list.Total);
        Assert.Single(list.Items);
        Assert.Equal(QboSyncRequestStatus.Failed, list.Items[0].Status);
    }

    [Fact]
    public async Task Update_account_enqueues_update_customer_when_name_changes()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "c";
            o.ClientSecret = "s";
            o.RedirectUri = "http://localhost/callback";
        });
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var accountId = Guid.NewGuid();
        db.Accounts.Add(new Account
        {
            Id = accountId,
            Name = "Before",
            Code = "BEF-01",
            QboCustomerId = "qbo-99",
            QboSyncStatus = QboSyncStatus.Synced,
            CreatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var client = factory.CreateClient();
        var put = await client.PutAsJsonAsync(
            $"/api/accounts/{accountId}",
            new AccountWriteRequest("After", "BEF-01", 1, 1, 1));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var updated = await put.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(updated);
        Assert.Equal(QboSyncStatus.Pending, updated.QboSyncStatus);

        var row = await db.QboSyncRequests.AsNoTracking()
            .OrderByDescending(r => r.CreatedAtUtc)
            .FirstAsync(r => r.EntityId == accountId);
        Assert.Equal(QboSyncOperations.UpdateCustomer, row.Operation);
        Assert.Equal(QboSyncRequestStatus.Pending, row.Status);
    }

    [Fact]
    public async Task Create_invoice_without_customer_fails_with_clear_error()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "c";
            o.ClientSecret = "s";
        });
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var account = new Account
        {
            Id = Guid.NewGuid(),
            Name = "No QBO",
            Code = "NQ",
            CreatedAtUtc = DateTime.UtcNow,
        };
        db.Accounts.Add(account);
        var row = new QboSyncRequest
        {
            Id = Guid.NewGuid(),
            Operation = QboSyncOperations.CreateInvoice,
            EntityType = QboSyncEntityTypes.Account,
            EntityId = account.Id,
            PayloadJson = "{}",
            Status = QboSyncRequestStatus.Pending,
            Attempts = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };
        db.QboSyncRequests.Add(row);
        db.QboConnections.Add(new QboConnection
        {
            Id = QboConnection.SingletonId,
            RealmId = "r1",
            AccessToken = "tok",
            RefreshToken = "ref",
            AccessTokenExpiresAtUtc = DateTime.UtcNow.AddHours(1),
            UpdatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var processor = scope.ServiceProvider.GetRequiredService<QboSyncRequestProcessor>();
        Assert.True(await processor.ProcessNextAsync(CancellationToken.None));

        var done = await db.QboSyncRequests.SingleAsync(r => r.Id == row.Id);
        Assert.Equal(QboSyncRequestStatus.Failed, done.Status);
        Assert.Contains("not synced", done.LastError!, StringComparison.OrdinalIgnoreCase);
    }

    private sealed record QboStatusDto(bool Connected, string? ConnectUrl);

    private sealed record QboListDto(
        IReadOnlyList<QboListItemDto> Items,
        int Page,
        int PageSize,
        int Total);

    private sealed record QboListItemDto(string Status);

    private sealed class CountingHttpClientFactory(Func<HttpResponseMessage> responder) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) =>
            new(new CountingHandler(responder)) { BaseAddress = new Uri("https://stub/") };
    }

    private sealed class CountingHandler(Func<HttpResponseMessage> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(responder());
    }
}
