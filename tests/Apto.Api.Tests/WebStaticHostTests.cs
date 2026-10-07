using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Apto.Api.Tests;

public class WebStaticHostTests
{
    [Fact]
    public async Task Root_serves_index_html_when_wwwroot_present()
    {
        var wwwroot = Path.Combine(Path.GetTempPath(), $"apto-wwwroot-{Guid.NewGuid():N}");
        Directory.CreateDirectory(wwwroot);
        var indexPath = Path.Combine(wwwroot, "index.html");
        await File.WriteAllTextAsync(indexPath, "<!DOCTYPE html><html><body id=\"root\">ok</body></html>");

        try
        {
            await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.UseWebRoot(wwwroot);
            });

            using var client = factory.CreateClient();
            var html = await client.GetStringAsync("/");
            Assert.Contains("id=\"root\"", html);
        }
        finally
        {
            if (Directory.Exists(wwwroot))
                Directory.Delete(wwwroot, recursive: true);
        }
    }

    [Fact]
    public async Task Unknown_api_route_returns_not_found_not_spa_html()
    {
        await using var factory = new AptoWebApplicationFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/unknown-route");
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("<!DOCTYPE html>", body);
    }
}
