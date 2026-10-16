using Apto.Api.Data;
using Apto.Api.QuickBooks;
using Apto.Api.ReferenceData;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Apto.Api.Tests;

public sealed class AptoWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _inMemoryDatabaseName = Guid.NewGuid().ToString("N");
    private readonly Action<QboOptions>? _configureQbo;
    private readonly Action<IServiceCollection>? _onConfigureServices;

    public AptoWebApplicationFactory(
        Action<QboOptions>? configureQbo = null,
        Action<IServiceCollection>? onConfigureServices = null)
    {
        _configureQbo = configureQbo;
        _onConfigureServices = onConfigureServices;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<AptoDbContext>>();
            services.AddDbContext<AptoDbContext>(options =>
                options.UseInMemoryDatabase(_inMemoryDatabaseName));

            if (_configureQbo is not null)
                services.PostConfigure(_configureQbo);

            _onConfigureServices?.Invoke(services);
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        db.Database.EnsureCreated();
        ReferenceDataSeeder.SeedIfEmptyAsync(db).GetAwaiter().GetResult();
        if (!db.AptoIdSequences.Any())
        {
            db.AptoIdSequences.Add(new Data.Entities.AptoIdSequence { Id = 1, NextNumber = 1 });
            db.SaveChanges();
        }

        return host;
    }
}
