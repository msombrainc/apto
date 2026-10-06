using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Data;

public interface IDatabaseMigrationApplier
{
    void ApplyPendingMigrations(AptoDbContext db);
}

public sealed class EfDatabaseMigrationApplier : IDatabaseMigrationApplier
{
    public void ApplyPendingMigrations(AptoDbContext db) => db.Database.Migrate();
}

public static class DatabaseStartup
{
    public static void ApplyMigrationsIfNeeded(
        IServiceProvider services,
        IHostEnvironment environment)
    {
        if (environment.IsEnvironment("Testing"))
            return;

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var applier = scope.ServiceProvider.GetRequiredService<IDatabaseMigrationApplier>();
        applier.ApplyPendingMigrations(db);
    }
}
