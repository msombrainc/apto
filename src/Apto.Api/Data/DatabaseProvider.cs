namespace Apto.Api.Data;

public static class DatabaseProvider
{
    /// <summary>
    /// SQLite file connection (STG demo) — not SQL Server "Data Source=server".
    /// </summary>
    public static bool IsSqlite(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return false;
        var t = connectionString.Trim();
        if (!t.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase))
            return false;
        return !t.Contains("Server=", StringComparison.OrdinalIgnoreCase)
            && !t.Contains("Initial Catalog=", StringComparison.OrdinalIgnoreCase);
    }
}
