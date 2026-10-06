var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

static string ResolveBuildId()
{
    var fromEnv = Environment.GetEnvironmentVariable("BUILD_ID");
    if (!string.IsNullOrWhiteSpace(fromEnv))
        return fromEnv.Trim();
    var buildIdFile = Path.Combine(AppContext.BaseDirectory, "BUILD_ID");
    if (File.Exists(buildIdFile))
        return File.ReadAllText(buildIdFile).Trim();
    return Environment.GetEnvironmentVariable("GITHUB_SHA")?.Trim() ?? "local";
}

var buildId = ResolveBuildId();

app.MapGet("/api/health", () => Results.Json(new { status = "ok", buildId }));
app.MapGet("/api/build-id", () => Results.Text(buildId, "text/plain"));

app.Run();

public partial class Program;
