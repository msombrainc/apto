using Apto.Api.Data;

namespace Apto.Api.Tests;

public class DatabaseProviderTests
{
    [Theory]
    [InlineData("Data Source=/var/opt/apto-data/apto.db", true)]
    [InlineData("Data Source=apto.db", true)]
    [InlineData("Server=localhost;Database=Apto;TrustServerCertificate=True", false)]
    [InlineData("Data Source=localhost;Initial Catalog=Apto;TrustServerCertificate=True", false)]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("   ", false)]
    public void IsSqlite_classifies_connection_strings(string? connectionString, bool expected)
    {
        Assert.Equal(expected, DatabaseProvider.IsSqlite(connectionString));
    }
}
