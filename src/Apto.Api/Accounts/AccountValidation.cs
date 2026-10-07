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

        error = null;
        return true;
    }
}
