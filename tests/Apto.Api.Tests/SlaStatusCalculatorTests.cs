using Apto.Api.Data.Entities;
using Apto.Api.Jobs;

namespace Apto.Api.Tests;

public class SlaStatusCalculatorTests
{
    [Theory]
    [InlineData(5, "on-track")]
    [InlineData(2, "at-risk")]
    [InlineData(0, "at-risk")]
    [InlineData(-1, "overdue")]
    public void SlaStatus_buckets(int daysRemaining, string expected)
    {
        Assert.Equal(expected, SlaStatusCalculator.SlaStatus(daysRemaining));
    }

    [Fact]
    public void Default_due_uses_account_sla_sum()
    {
        var account = new Account
        {
            Name = "A",
            Code = "A",
            SlaReceivingDays = 2,
            SlaProcessingDays = 3,
            SlaShippingDays = 1,
        };
        var start = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        var due = SlaStatusCalculator.DefaultDueDateUtc(start, account);
        Assert.Equal(new DateTime(2026, 1, 16), due.Date);
    }
}
