using System.Net;
using System.Net.Http.Json;
using System.Text;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.QuickBooks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Apto.Api.Tests;

public class QboOAuthEndpointsTests
{
    [Fact]
    public async Task Authorize_returns_503_when_not_configured()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/qbo/oauth/authorize");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task Callback_returns_400_when_code_missing()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "id";
            o.ClientSecret = "secret";
        });
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/qbo/oauth/callback?realmId=1");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Callback_returns_400_when_state_cookie_mismatch()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "id";
            o.ClientSecret = "secret";
        });
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", "qbo_oauth_state=expected");

        var response = await client.GetAsync("/api/qbo/oauth/callback?code=x&realmId=1&state=wrong");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Authorize_returns_url_when_configured()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "id";
            o.ClientSecret = "secret";
            o.RedirectUri = "http://localhost:8080/api/qbo/oauth/callback";
            o.TokenUrl = "https://oauth.test/token";
        });
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/qbo/oauth/authorize");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AuthorizeResponse>();
        Assert.NotNull(body);
        Assert.Contains("client_id=id", body.AuthorizeUrl);
    }

    [Fact]
    public async Task Callback_persists_connection_on_success()
    {
        var handler = new StubHttpHandler(req =>
        {
            if (req.RequestUri!.AbsoluteUri.Contains("oauth.test"))
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """{"access_token":"access","refresh_token":"refresh","expires_in":3600}""",
                        Encoding.UTF8,
                        "application/json"),
                };
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        });

        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "id";
            o.ClientSecret = "secret";
            o.RedirectUri = "http://localhost/api/qbo/oauth/callback";
            o.TokenUrl = "https://oauth.test/token";
        }).WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddSingleton<IHttpClientFactory>(new StubHttpClientFactory(handler));
            });
        });

        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        var authorize = await client.GetAsync("/api/qbo/oauth/authorize");
        Assert.Equal(HttpStatusCode.OK, authorize.StatusCode);
        var authorizeBody = await authorize.Content.ReadFromJsonAsync<AuthorizeResponse>();
        Assert.NotNull(authorizeBody);
        var state = new Uri(authorizeBody.AuthorizeUrl).Query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Split('=', 2))
            .First(p => p[0] == "state")[1];

        var response = await client.GetAsync(
            $"/api/qbo/oauth/callback?code=auth-code&realmId=realm-9&state={state}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var row = await db.QboConnections.SingleAsync();
        Assert.Equal("realm-9", row.RealmId);
        Assert.Equal("access", row.AccessToken);
        Assert.Equal("refresh", row.RefreshToken);
    }

    private sealed record AuthorizeResponse(string AuthorizeUrl);

    private sealed class StubHttpClientFactory(StubHttpHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler);
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
