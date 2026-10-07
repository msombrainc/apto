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
            builder.UseSetting(
                "ConnectionStrings:Default",
                "Server=localhost;Database=AptoTest;TrustServerCertificate=True");
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IDatabaseMigrationApplier>();
                services.AddSingleton<IDatabaseMigrationApplier>(recorder);
            });
        });

        _ = factory.CreateClient();
        Assert.True(recorder.WasCalled);
    }

    [Fact]
    public async Task Startup_skips_migration_applier_for_sqlite_stg_connection()
    {
        var recorder = new RecordingMigrationApplier();
        var dbPath = Path.Combine(Path.GetTempPath(), $"apto-stg-{Guid.NewGuid():N}.db");
        try
        {
            await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.UseSetting(WebHostDefaults.EnvironmentKey, Environments.Production);
                builder.UseSetting("ConnectionStrings:Default", $"Data Source={dbPath}");
                builder.ConfigureTestServices(services =>
                {
                    services.RemoveAll<IDatabaseMigrationApplier>();
                    services.AddSingleton<IDatabaseMigrationApplier>(recorder);
                });
            });

            using var client = factory.CreateClient();
            var accounts = await client.GetAsync("/api/accounts");
            accounts.EnsureSuccessStatusCode();
            Assert.False(recorder.WasCalled);
        }
        finally
        {
            if (File.Exists(dbPath))
                File.Delete(dbPath);
        }
    }

    [Fact]
    public async Task Startup_with_legacy_sqlite_without_jobs_table_serves_accounts()
    {
        var dbPath = Path.Combine(Path.GetTempPath(), $"apto-legacy-{Guid.NewGuid():N}.db");
        try
        {
            var conn = new Microsoft.Data.Sqlite.SqliteConnection($"Data Source={dbPath}");
            await conn.OpenAsync();
            await using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText =
                    """
                    CREATE TABLE "Accounts" (
                        "Id" TEXT NOT NULL PRIMARY KEY,
                        "Name" TEXT NOT NULL,
                        "Code" TEXT NOT NULL,
                        "SlaReceivingDays" INTEGER NOT NULL,
                        "SlaProcessingDays" INTEGER NOT NULL,
                        "SlaShippingDays" INTEGER NOT NULL,
                        "CreatedAtUtc" TEXT NOT NULL
                    );
                    CREATE UNIQUE INDEX "IX_Accounts_Code" ON "Accounts" ("Code");
                    """;
                await cmd.ExecuteNonQueryAsync();
            }
            await conn.CloseAsync();

            await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.UseSetting(WebHostDefaults.EnvironmentKey, Environments.Production);
                builder.UseSetting("ConnectionStrings:Default", $"Data Source={dbPath}");
            });

            using var client = factory.CreateClient();
            var accounts = await client.GetAsync("/api/accounts");
            accounts.EnsureSuccessStatusCode();
        }
        finally
        {
            if (File.Exists(dbPath))
                File.Delete(dbPath);
        }
    }

    [Fact]
    public async Task Startup_serves_health_without_connection_string()
    {
        await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting(WebHostDefaults.EnvironmentKey, Environments.Production);
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>());
            });
        });

        using var client = factory.CreateClient();
        var body = await client.GetStringAsync("/api/health");
        Assert.Contains("ok", body);
    }

    private sealed class RecordingMigrationApplier : IDatabaseMigrationApplier
    {
        public bool WasCalled { get; private set; }

        public void ApplyPendingMigrations(AptoDbContext db) => WasCalled = true;
    }
}
