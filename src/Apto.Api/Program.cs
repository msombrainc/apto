using Apto.Api.Accounts;
using Apto.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var isTesting = builder.Environment.IsEnvironment("Testing");

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});

builder.Services.AddSingleton<IDatabaseMigrationApplier, EfDatabaseMigrationApplier>();

if (!isTesting)
{
    builder.Services.AddDbContext<AptoDbContext>(options =>
    {
        var connectionString = builder.Configuration.GetConnectionString("Default");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionStrings:Default is required outside Testing.");

        options.UseSqlServer(connectionString);
    });
}

var app = builder.Build();

app.UseCors();

DatabaseStartup.ApplyMigrationsIfNeeded(app.Services, app.Environment);

static string ResolveBuildId(string contentRoot)
{
    var fromEnv = Environment.GetEnvironmentVariable("BUILD_ID");
    if (!string.IsNullOrWhiteSpace(fromEnv))
        return fromEnv.Trim();

    foreach (var dir in new[] { AppContext.BaseDirectory, contentRoot })
    {
        if (string.IsNullOrEmpty(dir))
            continue;
        var buildIdFile = Path.Combine(dir, "BUILD_ID");
        if (File.Exists(buildIdFile))
            return File.ReadAllText(buildIdFile).Trim();
    }

    return Environment.GetEnvironmentVariable("GITHUB_SHA")?.Trim() ?? "local";
}

var buildId = ResolveBuildId(app.Environment.ContentRootPath);

app.MapGet("/api/health", () => Results.Json(new { status = "ok", buildId }));
app.MapGet("/api/build-id", () => Results.Text(buildId, "text/plain"));
app.MapAccountEndpoints();

app.Run();

public partial class Program;
