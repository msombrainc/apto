using Apto.Api.Data;
using Apto.Api.QuickBooks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Apto.Api.Tests;

public sealed class AptoWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _inMemoryDatabaseName = Guid.NewGuid().ToString("N");
    private readonly Action<QboOptions>? _configureQbo;

    public AptoWebApplicationFactory(Action<QboOptions>? configureQbo = null)
    {
        _configureQbo = configureQbo;
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
        });
    }
}
