namespace Apto.Api.Jobs;

public static class JobValidation
{
    public static bool TryValidate(
        JobWriteRequest request,
        IReadOnlyCollection<string> allowedFacilityCodes,
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

        error = null;
        return true;
    }
}
