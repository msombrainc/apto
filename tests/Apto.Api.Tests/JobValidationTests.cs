using Apto.Api.Jobs;

namespace Apto.Api.Tests;

public class JobValidationTests
{
    [Fact]
    public void Rejects_empty_account_id()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.Empty, "GA", "x", DateTime.UtcNow, null),
            out var error);
        Assert.False(ok);
        Assert.Contains("accountId", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Rejects_default_start_date()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "GA", "x", default, null),
            out var error);
        Assert.False(ok);
        Assert.Contains("startDateUtc", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Rejects_due_before_start()
    {
        var start = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc);
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "GA", "x", start, start.AddDays(-1)),
            out var error);
        Assert.False(ok);
        Assert.Contains("dueDateUtc", error, StringComparison.OrdinalIgnoreCase);
    }
}
