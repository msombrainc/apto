using Apto.Api.Jobs;

namespace Apto.Api.Tests;

public class JobValidationTests
{
    [Fact]
    public void Rejects_empty_account_id()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.Empty, "GA", "x", DateTime.UtcNow, null),
            ["GA", "TX", "CA"],
            out var error);
        Assert.False(ok);
        Assert.Contains("accountId", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Rejects_default_start_date()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "GA", "x", default, null),
            ["GA"],
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
            ["GA"],
            out var error);
        Assert.False(ok);
        Assert.Contains("dueDateUtc", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Rejects_unknown_facility_code()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "ZZ", "x", DateTime.UtcNow, null),
            ["GA", "TX", "CA"],
            out var error);
        Assert.False(ok);
        Assert.Equal("facility is not an active reference code.", error);
    }

    [Fact]
    public void Rejects_inactive_facility_not_in_allowed_list()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "ga", "x", DateTime.UtcNow, null),
            ["TX", "CA"],
            out var error);
        Assert.False(ok);
        Assert.Equal("facility is not an active reference code.", error);
    }

    [Fact]
    public void Accepts_active_facility_case_insensitive()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "tx", "x", DateTime.UtcNow, null),
            ["GA", "TX", "CA"],
            out var error);
        Assert.True(ok);
        Assert.Null(error);
    }
}
