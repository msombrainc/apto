using System.Net;
using System.Net.Http.Json;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.QuickBooks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Apto.Api.Tests;

public class QboOAuthEndpointsTests
{
    [Fact]
    public async Task Authorize_returns_503_when_not_configured()
    {
        await using var factory = CreateFactory(configureQbo: null);
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/qbo/oauth/authorize");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task Callback_returns_400_when_code_missing()
    {
        await using var factory = CreateFactory(o =>
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
        await using var factory = CreateFactory(o =>
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
        await using var factory = CreateFactory(o =>
        {
            o.ClientId = "id";
            o.ClientSecret = "secret";
            o.RedirectUri = "http://localhost:8080/api/qbo/oauth/callback";
        });
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/qbo/oauth/authorize");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AuthorizeResponse>();
        Assert.NotNull(body);
        Assert.Contains("client_id=id", body.AuthorizeUrl);
    }

    private sealed record AuthorizeResponse(string AuthorizeUrl);

    private static WebApplicationFactory<Program> CreateFactory(Action<QboOptions>? configureQbo)
    {
        return new QboOAuthWebApplicationFactory(configureQbo);
    }

    private sealed class QboOAuthWebApplicationFactory(Action<QboOptions>? configureQbo)
        : WebApplicationFactory<Program>
    {
        private readonly string _db = Guid.NewGuid().ToString("N");

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<DbContextOptions<AptoDbContext>>();
                services.AddDbContext<AptoDbContext>(o => o.UseInMemoryDatabase(_db));

                if (configureQbo is not null)
                {
                    services.PostConfigure(configureQbo);
                }
            });
        }
    }
}
