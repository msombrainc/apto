using Apto.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Apto.Api.Tests;

public class MigrationStartupTests
{
    [Fact]
    public async Task Startup_skips_migration_applier_in_testing_environment()
    {
        var recorder = new RecordingMigrationApplier();
        await using var factory = new AptoWebApplicationFactory().WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IDatabaseMigrationApplier>();
                services.AddSingleton<IDatabaseMigrationApplier>(recorder);
            });
        });

        _ = factory.CreateClient();
        Assert.False(recorder.WasCalled);
    }

    [Fact]
    public async Task Startup_invokes_migration_applier_outside_testing_environment()
    {
        var recorder = new RecordingMigrationApplier();
        await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting(WebHostDefaults.EnvironmentKey, Environments.Development);
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["ConnectionStrings:Default"] =
                            "Server=localhost;Database=AptoTest;TrustServerCertificate=True",
                    });
            });
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IDatabaseMigrationApplier>();
                services.AddSingleton<IDatabaseMigrationApplier>(recorder);
            });
        });

        _ = factory.CreateClient();
        Assert.True(recorder.WasCalled);
    }

    private sealed class RecordingMigrationApplier : IDatabaseMigrationApplier
    {
        public bool WasCalled { get; private set; }

        public void ApplyPendingMigrations(AptoDbContext db) => WasCalled = true;
    }
}
