namespace Apto.Api.QuickBooks;

public sealed class QboOptions
{
    public const string SectionName = "QuickBooks";

    public string ClientId { get; set; } = "";

    public string ClientSecret { get; set; } = "";

    public string RedirectUri { get; set; } = "http://localhost:8080/api/qbo/oauth/callback";

    public string OAuthBaseUrl { get; set; } = "https://appcenter.intuit.com/connect/oauth2";

    public string TokenUrl { get; set; } = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

    public string ApiBaseUrl { get; set; } = "https://sandbox-quickbooks.api.intuit.com";

    /// <summary>STG/demo: seed <see cref="QboConnection"/> when empty (from CI secret, never commit).</summary>
    public string? BootstrapRealmId { get; set; }

    public string? BootstrapRefreshToken { get; set; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ClientId) && !string.IsNullOrWhiteSpace(ClientSecret);
}
