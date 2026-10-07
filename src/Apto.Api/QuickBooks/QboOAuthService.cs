using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Apto.Api.QuickBooks;

public sealed class QboOAuthService(
    AptoDbContext db,
    IOptions<QboOptions> options,
    IHttpClientFactory httpClientFactory)
{
    private readonly QboOptions _options = options.Value;

    public bool IsConfigured => _options.IsConfigured;

    public string BuildAuthorizeUrl(string state)
    {
        var query = new Dictionary<string, string?>
        {
            ["client_id"] = _options.ClientId,
            ["redirect_uri"] = _options.RedirectUri,
            ["response_type"] = "code",
            ["scope"] = "com.intuit.quickbooks.accounting",
            ["state"] = state,
        };
        var qs = string.Join(
            "&",
            query.Where(kv => !string.IsNullOrEmpty(kv.Value))
                .Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value!)}"));
        return $"{_options.OAuthBaseUrl}?{qs}";
    }

    public async Task<QboConnection> ExchangeCodeAsync(string code, string realmId, CancellationToken ct)
    {
        var token = await RequestTokenAsync(
            new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = _options.RedirectUri,
            },
            ct);

        return await PersistConnectionAsync(realmId, token, ct);
    }

    public async Task<QboConnection> EnsureAccessTokenAsync(CancellationToken ct)
    {
        var connection = await db.QboConnections.SingleOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("QBO not connected.");

        if (connection.AccessTokenExpiresAtUtc is { } exp
            && exp > DateTime.UtcNow.AddMinutes(2)
            && !string.IsNullOrEmpty(connection.AccessToken))
            return connection;

        if (string.IsNullOrEmpty(connection.RefreshToken))
            throw new InvalidOperationException("QBO refresh token missing.");

        var token = await RequestTokenAsync(
            new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["refresh_token"] = connection.RefreshToken,
            },
            ct);

        return await PersistConnectionAsync(connection.RealmId!, token, ct, connection);
    }

    private async Task<QboTokenResponse> RequestTokenAsync(
        Dictionary<string, string> form,
        CancellationToken ct)
    {
        if (!_options.IsConfigured)
            throw new InvalidOperationException("QuickBooks OAuth is not configured.");

        var client = httpClientFactory.CreateClient(nameof(QboOAuthService));
        using var request = new HttpRequestMessage(HttpMethod.Post, _options.TokenUrl);
        request.Content = new FormUrlEncodedContent(form);
        var basic = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{_options.ClientId}:{_options.ClientSecret}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basic);

        using var response = await client.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"QBO token request failed: {(int)response.StatusCode} {body}");

        var token = JsonSerializer.Deserialize<QboTokenResponse>(body)
            ?? throw new InvalidOperationException("QBO token response was empty.");
        if (string.IsNullOrEmpty(token.AccessToken))
            throw new InvalidOperationException("QBO token response missing access_token.");
        return token;
    }

    private async Task<QboConnection> PersistConnectionAsync(
        string realmId,
        QboTokenResponse token,
        CancellationToken ct,
        QboConnection? existing = null)
    {
        var row = existing ?? await db.QboConnections.SingleOrDefaultAsync(ct);
        if (row is null)
        {
            row = new QboConnection { Id = QboConnection.SingletonId };
            db.QboConnections.Add(row);
        }

        row.RealmId = realmId;
        row.AccessToken = token.AccessToken;
        if (!string.IsNullOrEmpty(token.RefreshToken))
            row.RefreshToken = token.RefreshToken;
        row.AccessTokenExpiresAtUtc = DateTime.UtcNow.AddSeconds(Math.Max(token.ExpiresIn - 60, 60));
        row.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return row;
    }
}
