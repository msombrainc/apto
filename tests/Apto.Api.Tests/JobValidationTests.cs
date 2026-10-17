using Apto.Api.Jobs;

namespace Apto.Api.Tests;

public class JobValidationTests
{
    private static readonly string[] DemoOps = ["WIP", "IN-TRANSIT", "In Transit"];

    [Fact]
    public void Rejects_empty_account_id()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.Empty, "GA", "WIP", DateTime.UtcNow, null),
            ["GA", "TX", "CA"],
            DemoOps,
            out var error);
        Assert.False(ok);
        Assert.Contains("accountId", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Rejects_default_start_date()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "GA", "WIP", default, null),
            ["GA"],
            DemoOps,
            out var error);
        Assert.False(ok);
        Assert.Contains("startDateUtc", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Rejects_due_before_start()
    {
        var start = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc);
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "GA", "WIP", start, start.AddDays(-1)),
            ["GA"],
            DemoOps,
            out var error);
        Assert.False(ok);
        Assert.Contains("dueDateUtc", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Rejects_unknown_facility_code()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "ZZ", "WIP", DateTime.UtcNow, null),
            ["GA", "TX", "CA"],
            DemoOps,
            out var error);
        Assert.False(ok);
        Assert.Equal("facility is not an active reference code.", error);
    }

    [Fact]
    public void Rejects_inactive_facility_not_in_allowed_list()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "ga", "WIP", DateTime.UtcNow, null),
            ["TX", "CA"],
            DemoOps,
            out var error);
        Assert.False(ok);
        Assert.Equal("facility is not an active reference code.", error);
    }

    [Fact]
    public void Accepts_active_facility_case_insensitive()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "tx", "WIP", DateTime.UtcNow, null),
            ["GA", "TX", "CA"],
            DemoOps,
            out var error);
        Assert.True(ok);
        Assert.Null(error);
    }

    [Fact]
    public void Rejects_unknown_ops_status()
    {
        var ok = JobValidation.TryValidate(
            new JobWriteRequest(Guid.NewGuid(), "GA", "not-valid", DateTime.UtcNow, null),
            ["GA"],
            DemoOps,
            out var error);
        Assert.False(ok);
        Assert.Contains("ops status", error, StringComparison.OrdinalIgnoreCase);
    }
}
