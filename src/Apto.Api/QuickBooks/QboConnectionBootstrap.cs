using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Apto.Api.QuickBooks;

/// <summary>One-time STG/demo seed from configuration (refresh token + realm), not for production.</summary>
public static class QboConnectionBootstrap
{
    public static async Task SeedFromConfigurationIfNeededAsync(
        IServiceProvider services,
        CancellationToken ct = default)
    {
        using var scope = services.CreateScope();
        var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
        if (env.IsEnvironment("Testing"))
            return;

        var options = scope.ServiceProvider.GetRequiredService<IOptions<QboOptions>>().Value;
        if (!options.IsConfigured
            || string.IsNullOrWhiteSpace(options.BootstrapRefreshToken)
            || string.IsNullOrWhiteSpace(options.BootstrapRealmId))
            return;

        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        if (await db.QboConnections.AnyAsync(ct))
            return;

        db.QboConnections.Add(new QboConnection
        {
            Id = QboConnection.SingletonId,
            RealmId = options.BootstrapRealmId.Trim(),
            RefreshToken = options.BootstrapRefreshToken.Trim(),
            UpdatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync(ct);
    }
}
