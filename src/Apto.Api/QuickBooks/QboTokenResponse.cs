using System.Text.Json.Serialization;

namespace Apto.Api.QuickBooks;

internal sealed class QboTokenResponse
{
    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonPropertyName("x_refresh_token_expires_in")]
    public int RefreshExpiresIn { get; set; }
}
