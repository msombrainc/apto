namespace Apto.Api.Jobs;

public static class JobValidation
{
    public static bool TryValidate(
        JobWriteRequest request,
        IReadOnlyCollection<string> allowedFacilityCodes,
        IReadOnlyCollection<string> allowedOpsStatusTokens,
        out string? error)
    {
        if (request.AccountId == Guid.Empty)
        {
            error = "accountId is required.";
            return false;
        }

        if (request.StartDateUtc == default)
        {
            error = "startDateUtc is required.";
            return false;
        }

        if (!string.IsNullOrWhiteSpace(request.FacilityCode))
        {
            var code = request.FacilityCode.Trim().ToUpperInvariant();
            if (!allowedFacilityCodes.Contains(code, StringComparer.OrdinalIgnoreCase))
            {
                error = "facility is not an active reference code.";
                return false;
            }
        }

        if (request.DueDateUtc is { } due && due.Date < request.StartDateUtc.Date)
        {
            error = "dueDateUtc cannot be before startDateUtc.";
            return false;
        }

        if (!string.IsNullOrWhiteSpace(request.OpsStatus))
        {
            var token = request.OpsStatus.Trim();
            if (!allowedOpsStatusTokens.Contains(token, StringComparer.OrdinalIgnoreCase))
            {
                error = "ops status is not an active reference value.";
                return false;
            }
        }

        error = null;
        return true;
    }
}
