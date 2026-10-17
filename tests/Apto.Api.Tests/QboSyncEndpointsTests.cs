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
    public async Task Retry_non_failed_returns_400()
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
            PayloadJson = "{}",
            Status = QboSyncRequestStatus.Pending,
            Attempts = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };
        db.QboSyncRequests.Add(row);
        await db.SaveChangesAsync();

        var client = factory.CreateClient();
        var retry = await client.PostAsync($"/api/qbo/requests/{row.Id}/retry", null);
        Assert.Equal(HttpStatusCode.BadRequest, retry.StatusCode);
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
    public async Task List_requests_filters_by_type()
    {
        await using var factory = new AptoWebApplicationFactory();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var entityId = Guid.NewGuid();
        db.QboSyncRequests.AddRange(
            new QboSyncRequest
            {
                Id = Guid.NewGuid(),
                Operation = QboSyncOperations.CreateCustomer,
                EntityType = QboSyncEntityTypes.Account,
                EntityId = entityId,
                PayloadJson = "{}",
                Status = QboSyncRequestStatus.Pending,
                Attempts = 0,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow,
            },
            new QboSyncRequest
            {
                Id = Guid.NewGuid(),
                Operation = QboSyncOperations.UpdateCustomer,
                EntityType = QboSyncEntityTypes.Account,
                EntityId = entityId,
                PayloadJson = "{}",
                Status = QboSyncRequestStatus.Pending,
                Attempts = 0,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow,
            });
        await db.SaveChangesAsync();

        var client = factory.CreateClient();
        var list = await client.GetFromJsonAsync<QboListDto>("/api/qbo/requests?type=CreateCustomer");
        Assert.NotNull(list);
        Assert.Equal(1, list.Total);
        Assert.Single(list.Items);
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
    public async Task Update_account_enqueues_update_customer_when_billing_address_changes()
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
            Name = "Billing Co",
            Code = "BILL-01",
            QboCustomerId = "qbo-88",
            QboSyncStatus = QboSyncStatus.Synced,
            CreatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var client = factory.CreateClient();
        var settings = new AccountSettingsDto
        {
            BillingAddress = new AccountBillingAddressDto { Line1 = "123 Main St" },
        };
        var put = await client.PutAsJsonAsync(
            $"/api/accounts/{accountId}",
            new AccountWriteRequest("Billing Co", "BILL-01", 1, 1, 1, Settings: settings));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var row = await db.QboSyncRequests.AsNoTracking()
            .OrderByDescending(r => r.CreatedAtUtc)
            .FirstAsync(r => r.EntityId == accountId);
        Assert.Equal(QboSyncOperations.UpdateCustomer, row.Operation);
        Assert.Equal(QboSyncRequestStatus.Pending, row.Status);
    }

    [Fact]
    public async Task Update_account_rules_only_does_not_enqueue_qbo()
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
            Name = "Rules Co",
            Code = "RUL-01",
            QboCustomerId = "qbo-77",
            QboSyncStatus = QboSyncStatus.Synced,
            CreatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var before = await db.QboSyncRequests.CountAsync(r => r.EntityId == accountId);

        var client = factory.CreateClient();
        var settings = new AccountSettingsDto
        {
            Rules = new AccountRulesDto { RequireProcessingApproval = true },
        };
        var put = await client.PutAsJsonAsync(
            $"/api/accounts/{accountId}",
            new AccountWriteRequest("Rules Co", "RUL-01", 1, 1, 1, Settings: settings));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var after = await db.QboSyncRequests.CountAsync(r => r.EntityId == accountId);
        Assert.Equal(before, after);
    }

    [Fact]
    public async Task Update_account_code_only_does_not_enqueue_qbo()
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
            Name = "Code Co",
            Code = "COD-01",
            QboCustomerId = "qbo-66",
            QboSyncStatus = QboSyncStatus.Synced,
            CreatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var before = await db.QboSyncRequests.CountAsync(r => r.EntityId == accountId);

        var client = factory.CreateClient();
        var put = await client.PutAsJsonAsync(
            $"/api/accounts/{accountId}",
            new AccountWriteRequest("Code Co", "COD-02", 1, 1, 1));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var after = await db.QboSyncRequests.CountAsync(r => r.EntityId == accountId);
        Assert.Equal(before, after);
    }

    [Fact]
    public async Task Manual_qbo_sync_returns_accepted_with_request_id()
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
            Name = "Manual",
            Code = "MAN-01",
            QboSyncStatus = QboSyncStatus.Synced,
            QboCustomerId = "qbo-1",
            CreatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var client = factory.CreateClient();
        var post = await client.PostAsync($"/api/accounts/{accountId}/qbo-sync", null);
        Assert.Equal(HttpStatusCode.Accepted, post.StatusCode);

        var body = await post.Content.ReadFromJsonAsync<ManualSyncResponse>();
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.RequestId);

        var row = await db.QboSyncRequests.AsNoTracking().SingleAsync(r => r.Id == body.RequestId);
        Assert.Equal(QboSyncRequestStatus.Pending, row.Status);
    }

    [Fact]
    public async Task Manual_qbo_sync_returns_not_found_for_missing_account()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "c";
            o.ClientSecret = "s";
        });
        var client = factory.CreateClient();
        var post = await client.PostAsync($"/api/accounts/{Guid.NewGuid()}/qbo-sync", null);
        Assert.Equal(HttpStatusCode.NotFound, post.StatusCode);
    }

    [Fact]
    public async Task Manual_qbo_sync_returns_503_when_not_configured()
    {
        await using var factory = new AptoWebApplicationFactory();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var accountId = Guid.NewGuid();
        db.Accounts.Add(new Account
        {
            Id = accountId,
            Name = "No QBO",
            Code = "NQ",
            CreatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var client = factory.CreateClient();
        var post = await client.PostAsync($"/api/accounts/{accountId}/qbo-sync", null);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, post.StatusCode);
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

    private sealed record ManualSyncResponse(Guid RequestId);

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
