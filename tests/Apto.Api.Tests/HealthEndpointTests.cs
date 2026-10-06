using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Apto.Api.Tests;

public class HealthEndpointTests
{
    [Fact]
    public async Task Health_uses_BUILD_ID_environment_variable()
    {
        Environment.SetEnvironmentVariable("BUILD_ID", "test-env-sha");
        try
        {
            await using var factory = new WebApplicationFactory<Program>();
            using var client = factory.CreateClient();

            var response = await client.GetAsync("/api/health");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("ok", doc.RootElement.GetProperty("status").GetString());
            Assert.Equal("test-env-sha", doc.RootElement.GetProperty("buildId").GetString());
        }
        finally
        {
            Environment.SetEnvironmentVariable("BUILD_ID", null);
        }
    }

    [Fact]
    public async Task Build_id_endpoint_returns_plain_text()
    {
        Environment.SetEnvironmentVariable("BUILD_ID", "plain-sha");
        try
        {
            await using var factory = new WebApplicationFactory<Program>();
            using var client = factory.CreateClient();
            var body = await client.GetStringAsync("/api/build-id");
            Assert.Equal("plain-sha", body);
        }
        finally
        {
            Environment.SetEnvironmentVariable("BUILD_ID", null);
        }
    }

    [Fact]
    public async Task Health_reads_BUILD_ID_file_from_content_root()
    {
        Environment.SetEnvironmentVariable("BUILD_ID", null);
        var tempDir = Directory.CreateDirectory(Path.Combine(Path.GetTempPath(), "apto-tests-" + Guid.NewGuid()));
        try
        {
            await File.WriteAllTextAsync(Path.Combine(tempDir.FullName, "BUILD_ID"), "file-sha");
            await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.UseSetting(WebHostDefaults.ContentRootKey, tempDir.FullName);
            });
            using var client = factory.CreateClient();
            var json = await client.GetStringAsync("/api/health");
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("file-sha", doc.RootElement.GetProperty("buildId").GetString());
        }
        finally
        {
            tempDir.Delete(recursive: true);
        }
    }
}
