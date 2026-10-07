using System.Net;
using Microsoft.AspNetCore.Hosting;

namespace Apto.Api.Tests;

public class StaticWebShellTests
{
    [Fact]
    public async Task Root_returns_index_html_when_wwwroot_present()
    {
        var root = CreateWwwRoot("apto-shell-root", "<html><body id=\"apto-stg-shell\">ok</body></html>");
        try
        {
            await using var factory = new AptoWebApplicationFactory().WithWebHostBuilder(builder =>
            {
                builder.UseSetting(WebHostDefaults.ContentRootKey, root);
            });
            using var client = factory.CreateClient();

            var response = await client.GetAsync("/");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var html = await response.Content.ReadAsStringAsync();
            Assert.Contains("apto-stg-shell", html, StringComparison.Ordinal);
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public async Task Spa_deep_link_falls_back_to_index_html()
    {
        var root = CreateWwwRoot("apto-shell-spa", "<html><body>spa</body></html>");
        try
        {
            await using var factory = new AptoWebApplicationFactory().WithWebHostBuilder(builder =>
            {
                builder.UseSetting(WebHostDefaults.ContentRootKey, root);
            });
            using var client = factory.CreateClient();

            var response = await client.GetAsync("/accounts");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var html = await response.Content.ReadAsStringAsync();
            Assert.Contains("spa", html, StringComparison.Ordinal);
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public async Task Health_and_accounts_still_work_with_static_middleware()
    {
        var root = CreateWwwRoot("apto-shell-api", "<html><body>ui</body></html>");
        try
        {
            await using var factory = new AptoWebApplicationFactory().WithWebHostBuilder(builder =>
            {
                builder.UseSetting(WebHostDefaults.ContentRootKey, root);
            });
            using var client = factory.CreateClient();

            var health = await client.GetAsync("/api/health");
            Assert.Equal(HttpStatusCode.OK, health.StatusCode);

            var accounts = await client.GetAsync("/api/accounts");
            Assert.Equal(HttpStatusCode.OK, accounts.StatusCode);
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public async Task Unknown_api_route_returns_404_not_spa_html()
    {
        var root = CreateWwwRoot("apto-shell-api404", "<html><body>ui</body></html>");
        try
        {
            await using var factory = new AptoWebApplicationFactory().WithWebHostBuilder(builder =>
            {
                builder.UseSetting(WebHostDefaults.ContentRootKey, root);
            });
            using var client = factory.CreateClient();

            var response = await client.GetAsync("/api/no-such-endpoint");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var body = await response.Content.ReadAsStringAsync();
            Assert.DoesNotContain("<html", body, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    private static string CreateWwwRoot(string namePrefix, string indexHtml)
    {
        var root = Directory.CreateDirectory(Path.Combine(Path.GetTempPath(), namePrefix + "-" + Guid.NewGuid())).FullName;
        var wwwroot = Directory.CreateDirectory(Path.Combine(root, "wwwroot"));
        File.WriteAllText(Path.Combine(wwwroot.FullName, "index.html"), indexHtml);
        return root;
    }
}
