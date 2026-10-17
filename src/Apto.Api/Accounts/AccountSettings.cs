using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Apto.Api.Accounts;

public sealed class AccountSettingsDto
{
    public decimal AptoPercentage { get; set; }

    public AccountFeesDto Fees { get; set; } = new();

    public AccountRulesDto Rules { get; set; } = new();

    public AccountServicesDto Services { get; set; } = new();

    public AccountBillingAddressDto BillingAddress { get; set; } = new();
}

public sealed class AccountFeesDto
{
    public decimal? Audit { get; set; }
    public decimal? Wipe { get; set; }
    public decimal? Shred { get; set; }
    public decimal? Recycle { get; set; }
    public decimal? Bulk { get; set; }
    public decimal? BulkRecycle { get; set; }
    public decimal? Storage { get; set; }
    public decimal? Teardown { get; set; }
    public decimal? Repair { get; set; }
    public decimal? OsInstall { get; set; }
    public decimal? Redeploy { get; set; }
}

public sealed class AccountRulesDto
{
    public bool RequireProcessingApproval { get; set; }
    public bool RequireRecycleApproval { get; set; }
    public bool RequireSalesApproval { get; set; }
    public bool RedeployOnly { get; set; }
    public bool RedeployBypass { get; set; }
    public bool ShredAllDrives { get; set; }
    public bool RecycleOnly { get; set; }
    public bool RequireShredPictures { get; set; }
    public bool RequireDamagePictures { get; set; }
}

public sealed class AccountServicesDto
{
    public bool OsInstallImaging { get; set; }
    public bool MemoryInstall { get; set; }
    public bool PartsReplacement { get; set; }
}

public sealed class AccountBillingAddressDto
{
    public string Line1 { get; set; } = "";

    public string? Line2 { get; set; }

    public string City { get; set; } = "";

    public string State { get; set; } = "";

    public string PostalCode { get; set; } = "";

    public string Country { get; set; } = "US";
}

internal static class AccountSettingsJson
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    internal static AccountSettingsDto Default() => new()
    {
        AptoPercentage = 0,
        Fees = new AccountFeesDto(),
        Rules = new AccountRulesDto(),
        Services = new AccountServicesDto(),
        BillingAddress = new AccountBillingAddressDto(),
    };

    internal static AccountSettingsDto Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Default();

        try
        {
            return JsonSerializer.Deserialize<AccountSettingsDto>(json, Options) ?? Default();
        }
        catch (JsonException)
        {
            return Default();
        }
    }

    internal static string Serialize(AccountSettingsDto settings) =>
        JsonSerializer.Serialize(settings, Options);

    internal static IEnumerable<(string Field, string? OldValue, string? NewValue)> DiffLeaves(
        AccountSettingsDto before,
        AccountSettingsDto after)
    {
        foreach (var change in DiffScalar("settings.aptoPercentage", FormatDecimal(before.AptoPercentage), FormatDecimal(after.AptoPercentage)))
            yield return change;

        foreach (var change in DiffFee("audit", before.Fees.Audit, after.Fees.Audit)) yield return change;
        foreach (var change in DiffFee("wipe", before.Fees.Wipe, after.Fees.Wipe)) yield return change;
        foreach (var change in DiffFee("shred", before.Fees.Shred, after.Fees.Shred)) yield return change;
        foreach (var change in DiffFee("recycle", before.Fees.Recycle, after.Fees.Recycle)) yield return change;
        foreach (var change in DiffFee("bulk", before.Fees.Bulk, after.Fees.Bulk)) yield return change;
        foreach (var change in DiffFee("bulkRecycle", before.Fees.BulkRecycle, after.Fees.BulkRecycle)) yield return change;
        foreach (var change in DiffFee("storage", before.Fees.Storage, after.Fees.Storage)) yield return change;
        foreach (var change in DiffFee("teardown", before.Fees.Teardown, after.Fees.Teardown)) yield return change;
        foreach (var change in DiffFee("repair", before.Fees.Repair, after.Fees.Repair)) yield return change;
        foreach (var change in DiffFee("osInstall", before.Fees.OsInstall, after.Fees.OsInstall)) yield return change;
        foreach (var change in DiffFee("redeploy", before.Fees.Redeploy, after.Fees.Redeploy)) yield return change;

        foreach (var change in DiffBool("settings.rules.requireProcessingApproval", before.Rules.RequireProcessingApproval, after.Rules.RequireProcessingApproval)) yield return change;
        foreach (var change in DiffBool("settings.rules.requireRecycleApproval", before.Rules.RequireRecycleApproval, after.Rules.RequireRecycleApproval)) yield return change;
        foreach (var change in DiffBool("settings.rules.requireSalesApproval", before.Rules.RequireSalesApproval, after.Rules.RequireSalesApproval)) yield return change;
        foreach (var change in DiffBool("settings.rules.redeployOnly", before.Rules.RedeployOnly, after.Rules.RedeployOnly)) yield return change;
        foreach (var change in DiffBool("settings.rules.redeployBypass", before.Rules.RedeployBypass, after.Rules.RedeployBypass)) yield return change;
        foreach (var change in DiffBool("settings.rules.shredAllDrives", before.Rules.ShredAllDrives, after.Rules.ShredAllDrives)) yield return change;
        foreach (var change in DiffBool("settings.rules.recycleOnly", before.Rules.RecycleOnly, after.Rules.RecycleOnly)) yield return change;
        foreach (var change in DiffBool("settings.rules.requireShredPictures", before.Rules.RequireShredPictures, after.Rules.RequireShredPictures)) yield return change;
        foreach (var change in DiffBool("settings.rules.requireDamagePictures", before.Rules.RequireDamagePictures, after.Rules.RequireDamagePictures)) yield return change;

        foreach (var change in DiffBool("settings.services.osInstallImaging", before.Services.OsInstallImaging, after.Services.OsInstallImaging)) yield return change;
        foreach (var change in DiffBool("settings.services.memoryInstall", before.Services.MemoryInstall, after.Services.MemoryInstall)) yield return change;
        foreach (var change in DiffBool("settings.services.partsReplacement", before.Services.PartsReplacement, after.Services.PartsReplacement)) yield return change;

        foreach (var change in DiffString("settings.billingAddress.line1", before.BillingAddress.Line1, after.BillingAddress.Line1)) yield return change;
        foreach (var change in DiffString("settings.billingAddress.line2", before.BillingAddress.Line2, after.BillingAddress.Line2)) yield return change;
        foreach (var change in DiffString("settings.billingAddress.city", before.BillingAddress.City, after.BillingAddress.City)) yield return change;
        foreach (var change in DiffString("settings.billingAddress.state", before.BillingAddress.State, after.BillingAddress.State)) yield return change;
        foreach (var change in DiffString("settings.billingAddress.postalCode", before.BillingAddress.PostalCode, after.BillingAddress.PostalCode)) yield return change;
        foreach (var change in DiffString("settings.billingAddress.country", before.BillingAddress.Country, after.BillingAddress.Country)) yield return change;
    }

    internal static bool BillingAddressEquals(AccountSettingsDto a, AccountSettingsDto b) =>
        string.Equals(Normalize(a.BillingAddress.Line1), Normalize(b.BillingAddress.Line1), StringComparison.Ordinal)
        && string.Equals(Normalize(a.BillingAddress.Line2), Normalize(b.BillingAddress.Line2), StringComparison.Ordinal)
        && string.Equals(Normalize(a.BillingAddress.City), Normalize(b.BillingAddress.City), StringComparison.Ordinal)
        && string.Equals(Normalize(a.BillingAddress.State), Normalize(b.BillingAddress.State), StringComparison.Ordinal)
        && string.Equals(Normalize(a.BillingAddress.PostalCode), Normalize(b.BillingAddress.PostalCode), StringComparison.Ordinal)
        && string.Equals(Normalize(a.BillingAddress.Country), Normalize(b.BillingAddress.Country), StringComparison.Ordinal);

    private static IEnumerable<(string, string?, string?)> DiffFee(string key, decimal? oldVal, decimal? newVal) =>
        DiffScalar($"settings.fees.{key}", FormatFee(oldVal), FormatFee(newVal));

    private static IEnumerable<(string, string?, string?)> DiffScalar(string field, string? oldVal, string? newVal)
    {
        if (string.Equals(oldVal, newVal, StringComparison.Ordinal))
            yield break;
        yield return (field, oldVal, newVal);
    }

    private static IEnumerable<(string, string?, string?)> DiffBool(string field, bool oldVal, bool newVal)
    {
        if (oldVal == newVal)
            yield break;
        yield return (field, oldVal.ToString(), newVal.ToString());
    }

    private static IEnumerable<(string, string?, string?)> DiffString(string field, string? oldVal, string? newVal)
    {
        var o = Normalize(oldVal);
        var n = Normalize(newVal);
        if (string.Equals(o, n, StringComparison.Ordinal))
            yield break;
        yield return (field, o, n);
    }

    private static string? FormatFee(decimal? value) =>
        value is null ? null : value.Value.ToString("0.##", CultureInfo.InvariantCulture);

    private static string FormatDecimal(decimal value) =>
        value.ToString(CultureInfo.InvariantCulture);

    private static string Normalize(string? value) => value?.Trim() ?? "";
}

internal static class AccountStatuses
{
    internal const string Active = "Active";
    internal const string Inactive = "Inactive";
}
