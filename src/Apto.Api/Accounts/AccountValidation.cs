namespace Apto.Api.Accounts;

internal static class AccountValidation
{
    internal const int NameMax = 200;
    internal const int CodeMax = 50;

    internal static bool TryValidate(AccountWriteRequest request, out string? error)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > NameMax)
        {
            error = $"name is required (max {NameMax} characters).";
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Length > CodeMax)
        {
            error = $"code is required (max {CodeMax} characters).";
            return false;
        }

        if (request.SlaReceivingDays < 0
            || request.SlaProcessingDays < 0
            || request.SlaShippingDays < 0)
        {
            error = "sla day fields must be non-negative integers.";
            return false;
        }

        var status = NormalizeStatus(request.Status);
        if (status is not AccountStatuses.Active and not AccountStatuses.Inactive)
        {
            error = "status must be Active or Inactive.";
            return false;
        }

        if (request.Settings is not null && !TryValidateSettings(request.Settings, out error))
            return false;

        error = null;
        return true;
    }

    internal static bool TryValidateSettings(AccountSettingsDto settings, out string? error)
    {
        if (settings.AptoPercentage < 0 || settings.AptoPercentage > 100)
        {
            error = "settings.aptoPercentage must be between 0 and 100.";
            return false;
        }

        if (!ValidateFees(settings.Fees, out error))
            return false;

        error = null;
        return true;
    }

    private static bool ValidateFees(AccountFeesDto fees, out string? error)
    {
        foreach (var (key, value) in FeeEntries(fees))
        {
            if (value is null)
                continue;
            if (value < 0)
            {
                error = $"settings.fees.{key} must be non-negative.";
                return false;
            }

            if (value != decimal.Round(value.Value, 2))
            {
                error = $"settings.fees.{key} must have at most two decimal places.";
                return false;
            }
        }

        error = null;
        return true;
    }

    private static IEnumerable<(string key, decimal? value)> FeeEntries(AccountFeesDto fees)
    {
        yield return ("audit", fees.Audit);
        yield return ("wipe", fees.Wipe);
        yield return ("shred", fees.Shred);
        yield return ("recycle", fees.Recycle);
        yield return ("bulk", fees.Bulk);
        yield return ("bulkRecycle", fees.BulkRecycle);
        yield return ("storage", fees.Storage);
        yield return ("teardown", fees.Teardown);
        yield return ("repair", fees.Repair);
        yield return ("osInstall", fees.OsInstall);
        yield return ("redeploy", fees.Redeploy);
    }

    internal static string NormalizeStatus(string? status) =>
        string.IsNullOrWhiteSpace(status) ? AccountStatuses.Active : status.Trim();

    internal static AccountSettingsDto MergeSettings(AccountSettingsDto? incoming) =>
        incoming ?? AccountSettingsJson.Default();

    internal static (int R, int P, int S) NormalizeSlaDays(int r, int p, int s) =>
        r == 0 && p == 0 && s == 0 ? (30, 30, 60) : (r, p, s);
}
