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
    public async Task Sync_creates_customer_when_connected()
    {
        var dbName = Guid.NewGuid().ToString("N");
        var services = new ServiceCollection();
        services.AddDbContext<AptoDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddSingleton<IOptions<QboOptions>>(Options.Create(new QboOptions
        {
            ClientId = "test-client",
            ClientSecret = "test-secret",
            ApiBaseUrl = "https://qbo.test",
            TokenUrl = "https://oauth.test/token",
        }));
        services.AddScoped<QboOAuthService>();
        services.AddScoped<IQboCustomerSyncService, QboCustomerSyncService>();

        var handler = new StubHttpHandler(req =>
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
        });

        services.AddSingleton<IHttpClientFactory>(new StubHttpClientFactory(handler));
        await using var provider = services.BuildServiceProvider();
        await using var scope = provider.CreateAsyncScope();
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
