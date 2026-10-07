using System.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Data;

/// <summary>
/// STG SQLite files are created with <see cref="DatabaseFacade.EnsureCreated"/>, which does not
/// evolve schema. Apply additive patches so deploys after model changes still boot.
/// </summary>
public static class SqliteStgSchemaPatcher
{
    public static void PatchIfNeeded(AptoDbContext db)
    {
        var connection = db.Database.GetDbConnection();
        if (connection is not SqliteConnection sqlite)
            return;

        var wasOpen = sqlite.State == ConnectionState.Open;
        if (!wasOpen)
            sqlite.Open();

        try
        {
            if (!TableExists(sqlite, "Accounts"))
                return;

            EnsureAccountsQboColumns(sqlite);
            EnsureQboConnectionsTable(sqlite);
            EnsureJobsTable(sqlite);
        }
        finally
        {
            if (!wasOpen)
                sqlite.Close();
        }
    }

    private static void EnsureAccountsQboColumns(SqliteConnection connection)
    {
        if (!ColumnExists(connection, "Accounts", "QboCustomerId"))
            Execute(connection, "ALTER TABLE \"Accounts\" ADD COLUMN \"QboCustomerId\" TEXT NULL;");

        if (!ColumnExists(connection, "Accounts", "QboSyncError"))
            Execute(connection, "ALTER TABLE \"Accounts\" ADD COLUMN \"QboSyncError\" TEXT NULL;");

        if (!ColumnExists(connection, "Accounts", "QboSyncStatus"))
        {
            Execute(
                connection,
                "ALTER TABLE \"Accounts\" ADD COLUMN \"QboSyncStatus\" TEXT NOT NULL DEFAULT 'skipped';");
        }
    }

    private static void EnsureQboConnectionsTable(SqliteConnection connection)
    {
        if (TableExists(connection, "QboConnections"))
            return;

        Execute(
            connection,
            """
            CREATE TABLE "QboConnections" (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_QboConnections" PRIMARY KEY AUTOINCREMENT,
                "RealmId" TEXT NULL,
                "AccessToken" TEXT NULL,
                "RefreshToken" TEXT NULL,
                "AccessTokenExpiresAtUtc" TEXT NULL,
                "UpdatedAtUtc" TEXT NOT NULL
            );
            """);
    }

    private static void EnsureJobsTable(SqliteConnection connection)
    {
        if (TableExists(connection, "Jobs"))
            return;

        Execute(
            connection,
            """
            CREATE TABLE "Jobs" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_Jobs" PRIMARY KEY,
                "AccountId" TEXT NOT NULL,
                "FacilityCode" TEXT NULL,
                "OpsStatus" TEXT NULL,
                "StartDateUtc" TEXT NULL,
                "DueDateUtc" TEXT NULL,
                "CreatedAtUtc" TEXT NOT NULL,
                CONSTRAINT "FK_Jobs_Accounts_AccountId" FOREIGN KEY ("AccountId") REFERENCES "Accounts" ("Id") ON DELETE CASCADE
            );
            """);
        Execute(connection, """CREATE INDEX "IX_Jobs_AccountId" ON "Jobs" ("AccountId");""");
    }

    private static bool TableExists(SqliteConnection connection, string table)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText =
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = $name LIMIT 1;";
        cmd.Parameters.AddWithValue("$name", table);
        return cmd.ExecuteScalar() is not null;
    }

    private static bool ColumnExists(SqliteConnection connection, string table, string column)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = $"SELECT 1 FROM pragma_table_info('{table}') WHERE name = $name LIMIT 1;";
        cmd.Parameters.AddWithValue("$name", column);
        return cmd.ExecuteScalar() is not null;
    }

    private static void Execute(SqliteConnection connection, string sql)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = sql;
        cmd.ExecuteNonQuery();
    }
}
