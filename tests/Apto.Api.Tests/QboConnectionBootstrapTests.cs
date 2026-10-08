using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.QuickBooks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Apto.Api.Tests;

public class QboConnectionBootstrapTests
{
    [Fact]
    public async Task Bootstrap_seeds_singleton_row_when_configured_and_empty()
    {
        var services = BuildServices("qbo-boot-1", "realm-1", "rt-abc");
        await using var sp = services.BuildServiceProvider();
        await EnsureDb(sp);

        await QboConnectionBootstrap.SeedFromConfigurationIfNeededAsync(sp);

        await using var scope = sp.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var row = await db.QboConnections.SingleAsync();
        Assert.Equal(QboConnection.SingletonId, row.Id);
        Assert.Equal("realm-1", row.RealmId);
        Assert.Equal("rt-abc", row.RefreshToken);
    }

    [Fact]
    public async Task Bootstrap_skips_when_row_already_exists()
    {
        var services = BuildServices("qbo-boot-2", "new-realm", "new-rt");
        await using var sp = services.BuildServiceProvider();
        await using (var scope = sp.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
            await db.Database.EnsureCreatedAsync();
            db.QboConnections.Add(new QboConnection
            {
                Id = QboConnection.SingletonId,
                RealmId = "existing",
                RefreshToken = "existing-rt",
                UpdatedAtUtc = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        await QboConnectionBootstrap.SeedFromConfigurationIfNeededAsync(sp);

        await using var verify = sp.CreateAsyncScope();
        var row = await verify.ServiceProvider.GetRequiredService<AptoDbContext>().QboConnections.SingleAsync();
        Assert.Equal("existing", row.RealmId);
    }

    private static async Task EnsureDb(IServiceProvider sp)
    {
        await using var scope = sp.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    private static ServiceCollection BuildServices(string dbName, string realm, string refresh)
    {
        var services = new ServiceCollection();
        services.AddDbContext<AptoDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.Configure<QboOptions>(o =>
        {
            o.ClientId = "cid";
            o.ClientSecret = "sec";
            o.BootstrapRealmId = realm;
            o.BootstrapRefreshToken = refresh;
        });
        services.AddSingleton<IWebHostEnvironment>(new TestWebHostEnvironment(Environments.Development));
        services.AddOptions();
        return services;
    }

    private sealed class TestWebHostEnvironment(string environmentName) : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "Apto.Api.Tests";
        public string WebRootPath { get; set; } = "";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider WebRootFileProvider { get; set; } = null!;
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
