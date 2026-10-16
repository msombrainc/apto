using System.Data;
using Apto.Api.ReferenceData;
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
            EnsureAssetScanColumns(sqlite);
            EnsureAptoIdSequenceTable(sqlite);
            BackfillAptoIds(sqlite);
            EnsureAssetScanIndexes(sqlite);
            EnsureAssetChangeLogsTable(sqlite);
            EnsureReferenceItemsTable(sqlite);
            EnsureQboSyncRequestsTable(sqlite);
            EnsureCategoriesIsActiveColumn(sqlite);
            ReferenceDataSeeder.SeedIfEmptyAsync(db).GetAwaiter().GetResult();
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

    private static void EnsureAssetScanColumns(SqliteConnection connection)
    {
        if (!TableExists(connection, "Assets"))
            return;

        if (!ColumnExists(connection, "Assets", "AptoId"))
            Execute(connection, "ALTER TABLE \"Assets\" ADD COLUMN \"AptoId\" TEXT NULL;");

        if (!ColumnExists(connection, "Assets", "Grade"))
            Execute(connection, "ALTER TABLE \"Assets\" ADD COLUMN \"Grade\" TEXT NULL;");

        if (!ColumnExists(connection, "Assets", "Status"))
            Execute(connection, "ALTER TABLE \"Assets\" ADD COLUMN \"Status\" TEXT NULL;");

        if (!ColumnExists(connection, "Assets", "LocationId"))
            Execute(connection, "ALTER TABLE \"Assets\" ADD COLUMN \"LocationId\" TEXT NULL;");
    }

    private static void EnsureAssetScanIndexes(SqliteConnection connection)
    {
        if (!TableExists(connection, "Assets"))
            return;

        if (!IndexExists(connection, "IX_Assets_AptoId"))
            Execute(connection, """CREATE UNIQUE INDEX "IX_Assets_AptoId" ON "Assets" ("AptoId");""");

        if (!IndexExists(connection, "IX_Assets_SerialNumber"))
            Execute(connection, """CREATE INDEX "IX_Assets_SerialNumber" ON "Assets" ("SerialNumber");""");
    }

    private static void EnsureAptoIdSequenceTable(SqliteConnection connection)
    {
        if (TableExists(connection, "AptoIdSequences"))
            return;

        Execute(
            connection,
            """
            CREATE TABLE "AptoIdSequences" (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_AptoIdSequences" PRIMARY KEY,
                "NextNumber" INTEGER NOT NULL
            );
            """);

        using var countCmd = connection.CreateCommand();
        countCmd.CommandText = "SELECT COUNT(*) FROM \"Assets\";";
        var count = Convert.ToInt32(countCmd.ExecuteScalar());
        Execute(
            connection,
            $"INSERT INTO \"AptoIdSequences\" (\"Id\", \"NextNumber\") VALUES (1, {count + 1});");
    }

    private static void BackfillAptoIds(SqliteConnection connection)
    {
        if (!TableExists(connection, "Assets"))
            return;

        using var needsCmd = connection.CreateCommand();
        needsCmd.CommandText =
            "SELECT COUNT(*) FROM \"Assets\" WHERE \"AptoId\" IS NULL OR \"AptoId\" = '';";
        var needs = Convert.ToInt32(needsCmd.ExecuteScalar());
        if (needs == 0)
            return;

        using var selectCmd = connection.CreateCommand();
        selectCmd.CommandText =
            """
            SELECT "Id" FROM "Assets"
            WHERE "AptoId" IS NULL OR "AptoId" = ''
            ORDER BY "CreatedAtUtc";
            """;
        using var reader = selectCmd.ExecuteReader();
        var ids = new List<string>();
        while (reader.Read())
            ids.Add(reader.GetString(0));

        var seq = 1;
        if (TableExists(connection, "AptoIdSequences"))
        {
            using var maxCmd = connection.CreateCommand();
            maxCmd.CommandText =
                "SELECT \"NextNumber\" FROM \"AptoIdSequences\" WHERE \"Id\" = 1 LIMIT 1;";
            var maxObj = maxCmd.ExecuteScalar();
            if (maxObj is not null && maxObj is not DBNull)
                seq = Convert.ToInt32(maxObj);
        }

        foreach (var id in ids)
        {
            var aptoId = $"A{seq:D7}";
            using var updateCmd = connection.CreateCommand();
            updateCmd.CommandText = "UPDATE \"Assets\" SET \"AptoId\" = $apto WHERE \"Id\" = $id;";
            updateCmd.Parameters.AddWithValue("$apto", aptoId);
            updateCmd.Parameters.AddWithValue("$id", id);
            updateCmd.ExecuteNonQuery();
            seq++;
        }

        if (TableExists(connection, "AptoIdSequences"))
        {
            using var updSeq = connection.CreateCommand();
            updSeq.CommandText =
                "UPDATE \"AptoIdSequences\" SET \"NextNumber\" = $n WHERE \"Id\" = 1;";
            updSeq.Parameters.AddWithValue("$n", seq);
            updSeq.ExecuteNonQuery();
        }
    }

    private static bool IndexExists(SqliteConnection connection, string indexName)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText =
            "SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = $name LIMIT 1;";
        cmd.Parameters.AddWithValue("$name", indexName);
        return cmd.ExecuteScalar() is not null;
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

    private static void EnsureReferenceItemsTable(SqliteConnection connection)
    {
        if (TableExists(connection, "ReferenceItems"))
            return;

        Execute(
            connection,
            """
            CREATE TABLE "ReferenceItems" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_ReferenceItems" PRIMARY KEY,
                "Type" TEXT NOT NULL,
                "Code" TEXT NOT NULL,
                "Name" TEXT NOT NULL,
                "ParentId" TEXT NULL,
                "Group" TEXT NULL,
                "CertificateGroup" TEXT NULL,
                "SortOrder" INTEGER NOT NULL,
                "IsActive" INTEGER NOT NULL,
                "CreatedAtUtc" TEXT NOT NULL,
                "UpdatedAtUtc" TEXT NOT NULL,
                CONSTRAINT "FK_ReferenceItems_ReferenceItems_ParentId" FOREIGN KEY ("ParentId") REFERENCES "ReferenceItems" ("Id")
            );
            """);
        Execute(connection, """CREATE INDEX "IX_ReferenceItems_Type_Code" ON "ReferenceItems" ("Type", "Code");""");
        Execute(
            connection,
            """CREATE INDEX "IX_ReferenceItems_Type_ParentId_Code" ON "ReferenceItems" ("Type", "ParentId", "Code");""");
    }

    private static void EnsureQboSyncRequestsTable(SqliteConnection connection)
    {
        if (TableExists(connection, "QboSyncRequests"))
            return;

        Execute(
            connection,
            """
            CREATE TABLE "QboSyncRequests" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_QboSyncRequests" PRIMARY KEY,
                "Operation" TEXT NOT NULL,
                "EntityType" TEXT NOT NULL,
                "EntityId" TEXT NOT NULL,
                "PayloadJson" TEXT NOT NULL,
                "Status" TEXT NOT NULL,
                "Attempts" INTEGER NOT NULL,
                "LastError" TEXT NULL,
                "QboId" TEXT NULL,
                "CreatedAtUtc" TEXT NOT NULL,
                "UpdatedAtUtc" TEXT NOT NULL,
                "SentAtUtc" TEXT NULL
            );
            """);
        Execute(
            connection,
            """CREATE INDEX "IX_QboSyncRequests_Status_CreatedAtUtc" ON "QboSyncRequests" ("Status", "CreatedAtUtc");""");
    }

    private static void EnsureCategoriesIsActiveColumn(SqliteConnection connection)
    {
        if (!TableExists(connection, "Categories"))
            return;

        if (!ColumnExists(connection, "Categories", "IsActive"))
        {
            Execute(
                connection,
                "ALTER TABLE \"Categories\" ADD COLUMN \"IsActive\" INTEGER NOT NULL DEFAULT 1;");
        }
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
