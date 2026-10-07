using System.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Data;

/// <summary>
/// STG SQLite files are created with <see cref="DatabaseFacade.EnsureCreated"/>, which does not
/// evolve schema. Apply additive patches so deploys after model changes still boot.
/// When changing <see cref="AptoDbContext"/> or EF migrations, mirror additive DDL here.
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
            EnsureCategoriesTable(sqlite);
            EnsurePartNumbersTable(sqlite);
            EnsureAssetsTable(sqlite);
            EnsureAssetChangeLogsTable(sqlite);
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

    private static void EnsureCategoriesTable(SqliteConnection connection)
    {
        if (TableExists(connection, "Categories"))
            return;

        Execute(
            connection,
            """
            CREATE TABLE "Categories" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_Categories" PRIMARY KEY,
                "Name" TEXT NOT NULL
            );
            """);
        Execute(connection, """CREATE UNIQUE INDEX "IX_Categories_Name" ON "Categories" ("Name");""");
    }

    private static void EnsurePartNumbersTable(SqliteConnection connection)
    {
        if (TableExists(connection, "PartNumbers"))
            return;

        Execute(
            connection,
            """
            CREATE TABLE "PartNumbers" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_PartNumbers" PRIMARY KEY,
                "Number" TEXT NOT NULL,
                "CategoryId" TEXT NULL,
                CONSTRAINT "FK_PartNumbers_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id")
            );
            """);
        Execute(connection, """CREATE UNIQUE INDEX "IX_PartNumbers_Number" ON "PartNumbers" ("Number");""");
        Execute(connection, """CREATE INDEX "IX_PartNumbers_CategoryId" ON "PartNumbers" ("CategoryId");""");
    }

    private static void EnsureAssetsTable(SqliteConnection connection)
    {
        if (TableExists(connection, "Assets"))
            return;

        if (!TableExists(connection, "Jobs"))
            return;

        Execute(
            connection,
            """
            CREATE TABLE "Assets" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_Assets" PRIMARY KEY,
                "JobId" TEXT NOT NULL,
                "SerialNumber" TEXT NULL,
                "PartNumberId" TEXT NULL,
                "CreatedAtUtc" TEXT NOT NULL,
                CONSTRAINT "FK_Assets_Jobs_JobId" FOREIGN KEY ("JobId") REFERENCES "Jobs" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_Assets_PartNumbers_PartNumberId" FOREIGN KEY ("PartNumberId") REFERENCES "PartNumbers" ("Id")
            );
            """);
        Execute(connection, """CREATE INDEX "IX_Assets_JobId" ON "Assets" ("JobId");""");
        Execute(connection, """CREATE INDEX "IX_Assets_PartNumberId" ON "Assets" ("PartNumberId");""");
    }

    private static void EnsureAssetChangeLogsTable(SqliteConnection connection)
    {
        if (TableExists(connection, "AssetChangeLogs"))
            return;

        if (!TableExists(connection, "Assets"))
            return;

        Execute(
            connection,
            """
            CREATE TABLE "AssetChangeLogs" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_AssetChangeLogs" PRIMARY KEY,
                "AssetId" TEXT NOT NULL,
                "FieldName" TEXT NOT NULL,
                "OldValue" TEXT NULL,
                "NewValue" TEXT NULL,
                "ChangedBy" TEXT NOT NULL,
                "ChangedAtUtc" TEXT NOT NULL,
                CONSTRAINT "FK_AssetChangeLogs_Assets_AssetId" FOREIGN KEY ("AssetId") REFERENCES "Assets" ("Id") ON DELETE CASCADE
            );
            """);
        Execute(connection, """CREATE INDEX "IX_AssetChangeLogs_AssetId" ON "AssetChangeLogs" ("AssetId");""");
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
