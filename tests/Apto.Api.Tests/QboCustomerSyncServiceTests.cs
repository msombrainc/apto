using System.Net;
using System.Text;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.QuickBooks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Apto.Api.Tests;

public class QboCustomerSyncServiceTests
{
    [Fact]
    public async Task Sync_returns_skipped_when_not_configured()
    {
        await using var scope = await BuildScopeAsync(configure: null, handler: null);
        var sync = scope.ServiceProvider.GetRequiredService<IQboCustomerSyncService>();
        var account = new Account
        {
            Id = Guid.NewGuid(),
            Name = "Acme",
            Code = "ACME",
            CreatedAtUtc = DateTime.UtcNow,
        };

        var result = await sync.SyncAccountCustomerAsync(account, CancellationToken.None);
        Assert.Equal(QboSyncStatus.Skipped, result.Status);
    }

    [Fact]
    public async Task Sync_returns_failed_when_not_connected()
    {
        await using var scope = await BuildScopeAsync(
            configure: o =>
            {
                o.ClientId = "c";
                o.ClientSecret = "s";
            },
            handler: new StubHttpHandler(_ => new HttpResponseMessage(HttpStatusCode.NotFound)));

        var sync = scope.ServiceProvider.GetRequiredService<IQboCustomerSyncService>();
        var account = new Account
        {
            Id = Guid.NewGuid(),
            Name = "Acme",
            Code = "ACME",
            CreatedAtUtc = DateTime.UtcNow,
        };

        var result = await sync.SyncAccountCustomerAsync(account, CancellationToken.None);
        Assert.Equal(QboSyncStatus.Failed, result.Status);
        Assert.NotNull(result.Error);
    }

    [Fact]
    public async Task Sync_returns_failed_on_qbo_http_error()
    {
        await using var scope = await BuildScopeAsync(
            configure: o =>
            {
                o.ClientId = "c";
                o.ClientSecret = "s";
                o.ApiBaseUrl = "https://qbo.test";
                o.TokenUrl = "https://oauth.test/token";
            },
            handler: new StubHttpHandler(req =>
            {
                if (req.RequestUri!.AbsoluteUri.Contains("oauth.test"))
                {
                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(
                            """{"access_token":"a","refresh_token":"r","expires_in":3600}""",
                            Encoding.UTF8,
                            "application/json"),
                    };
                }

                return new HttpResponseMessage(HttpStatusCode.BadRequest)
                {
                    Content = new StringContent("{\"Fault\":{}}", Encoding.UTF8, "application/json"),
                };
            }));

        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        db.QboConnections.Add(new QboConnection
        {
            Id = QboConnection.SingletonId,
            RealmId = "realm",
            RefreshToken = "r",
            AccessToken = "stale",
            AccessTokenExpiresAtUtc = DateTime.UtcNow.AddMinutes(-5),
            UpdatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var sync = scope.ServiceProvider.GetRequiredService<IQboCustomerSyncService>();
        var result = await sync.SyncAccountCustomerAsync(
            new Account { Id = Guid.NewGuid(), Name = "N", Code = "C", CreatedAtUtc = DateTime.UtcNow },
            CancellationToken.None);

        Assert.Equal(QboSyncStatus.Failed, result.Status);
        Assert.Contains("400", result.Error);
    }

    [Fact]
    public async Task Sync_creates_customer_when_connected()
    {
        await using var scope = await BuildScopeAsync(
            configure: o =>
            {
                o.ClientId = "test-client";
                o.ClientSecret = "test-secret";
                o.ApiBaseUrl = "https://qbo.test";
                o.TokenUrl = "https://oauth.test/token";
            },
            handler: new StubHttpHandler(req =>
        {
            if (req.RequestUri!.AbsoluteUri.Contains("oauth.test"))
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """{"access_token":"access-1","refresh_token":"refresh-2","expires_in":3600}""",
                        Encoding.UTF8,
                        "application/json"),
                };
            }

            if (req.RequestUri!.AbsoluteUri.Contains("/customer"))
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """{"Customer":{"Id":"42"}}""",
                        Encoding.UTF8,
                        "application/json"),
                };
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        }));

        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        db.QboConnections.Add(new QboConnection
        {
            Id = QboConnection.SingletonId,
            RealmId = "realm-1",
            RefreshToken = "refresh-1",
            AccessToken = "stale",
            AccessTokenExpiresAtUtc = DateTime.UtcNow.AddMinutes(-5),
            UpdatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var sync = scope.ServiceProvider.GetRequiredService<IQboCustomerSyncService>();
        var account = new Account
        {
            Id = Guid.NewGuid(),
            Name = "Acme",
            Code = "ACME",
            CreatedAtUtc = DateTime.UtcNow,
        };

        var result = await sync.SyncAccountCustomerAsync(account, CancellationToken.None);

        Assert.Equal(QboSyncStatus.Synced, result.Status);
        Assert.Equal("42", result.CustomerId);
        Assert.Null(result.Error);

        var connection = await db.QboConnections.SingleAsync();
        Assert.Equal("refresh-2", connection.RefreshToken);
    }

    private static async Task<AsyncServiceScope> BuildScopeAsync(
        Action<QboOptions>? configure,
        StubHttpHandler? handler)
    {
        var dbName = Guid.NewGuid().ToString("N");
        var services = new ServiceCollection();
        services.AddDbContext<AptoDbContext>(o => o.UseInMemoryDatabase(dbName));
        var options = new QboOptions();
        configure?.Invoke(options);
        services.AddSingleton<IOptions<QboOptions>>(Options.Create(options));
        services.AddScoped<QboOAuthService>();
        services.AddScoped<IQboCustomerSyncService, QboCustomerSyncService>();
        services.AddSingleton<IHttpClientFactory>(
            new StubHttpClientFactory(handler ?? new StubHttpHandler(_ => new HttpResponseMessage(HttpStatusCode.NotFound))));
        var provider = services.BuildServiceProvider();
        return provider.CreateAsyncScope();
    }

    private sealed class StubHttpClientFactory(StubHttpHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler) { BaseAddress = new Uri("https://stub/") };
    }

    private sealed class StubHttpHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(responder(request));
    }
}
