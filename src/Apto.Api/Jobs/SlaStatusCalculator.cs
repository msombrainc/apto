using Apto.Api.Data.Entities;

namespace Apto.Api.Jobs;

public static class SlaStatusCalculator
{
    public static readonly string[] AllowedFacilities = ["GA", "TX", "CA"];

    public static int TotalSlaDays(Account account) =>
        account.SlaReceivingDays + account.SlaProcessingDays + account.SlaShippingDays;

    public static DateTime DefaultDueDateUtc(DateTime startDateUtc, Account account)
    {
        var start = startDateUtc.Date;
        return start.AddDays(TotalSlaDays(account));
    }

    public static int DaysRemaining(DateTime dueDateUtc, DateTime? utcNow = null)
    {
        var today = (utcNow ?? DateTime.UtcNow).Date;
        return (dueDateUtc.Date - today).Days;
    }

    public static string SlaStatus(int daysRemaining)
    {
        if (daysRemaining < 0)
            return "overdue";
        if (daysRemaining <= 2)
            return "at-risk";
        return "on-track";
    }
}
