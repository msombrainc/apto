using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Apto.Api.Data.Entities;
using Microsoft.Extensions.Options;

namespace Apto.Api.QuickBooks;

public sealed class QboCustomerSyncService(
    QboOAuthService oauth,
    IOptions<QboOptions> options,
    IHttpClientFactory httpClientFactory) : IQboCustomerSyncService
{
    private readonly QboOptions _options = options.Value;

    public async Task<QboSyncResult> SyncAccountCustomerAsync(Account account, CancellationToken ct)
    {
        if (!_options.IsConfigured)
            return new QboSyncResult(QboSyncStatus.Skipped, null, null);

        var payload = QboCustomerPayload.FromAccount(account);
        return await CreateCustomerAsync(payload, ct);
    }

    public async Task<QboSyncResult> CreateCustomerAsync(QboCustomerPayload payload, CancellationToken ct)
    {
        if (!_options.IsConfigured)
            return new QboSyncResult(QboSyncStatus.Skipped, null, null);

        try
        {
            var connection = await oauth.EnsureAccessTokenAsync(ct);
            if (string.IsNullOrEmpty(connection.RealmId))
                return new QboSyncResult(QboSyncStatus.Failed, null, "QBO realm id missing.");

            var json = payload.ToJson();
            var url =
                $"{_options.ApiBaseUrl.TrimEnd('/')}/v3/company/{connection.RealmId}/customer?minorversion=65";

            using var response = await SendJsonAsync(HttpMethod.Post, url, connection.AccessToken!, json, ct);
            return await ParseCustomerResponseAsync(response, ct);
        }
        catch (Exception ex)
        {
            return new QboSyncResult(QboSyncStatus.Failed, null, ex.Message);
        }
    }

    public async Task<QboSyncResult> UpdateCustomerAsync(
        string qboCustomerId,
        QboCustomerPayload payload,
        CancellationToken ct)
    {
        if (!_options.IsConfigured)
            return new QboSyncResult(QboSyncStatus.Skipped, null, null);

        try
        {
            var connection = await oauth.EnsureAccessTokenAsync(ct);
            if (string.IsNullOrEmpty(connection.RealmId))
                return new QboSyncResult(QboSyncStatus.Failed, null, "QBO realm id missing.");

            var sparse = new
            {
                Id = qboCustomerId,
                SyncToken = "0",
                sparse = true,
                DisplayName = payload.DisplayName,
                CompanyName = payload.CompanyName,
            };
            var json = JsonSerializer.Serialize(sparse);
            var url =
                $"{_options.ApiBaseUrl.TrimEnd('/')}/v3/company/{connection.RealmId}/customer?minorversion=65";

            using var response = await SendJsonAsync(HttpMethod.Post, url, connection.AccessToken!, json, ct);
            return await ParseCustomerResponseAsync(response, ct);
        }
        catch (Exception ex)
        {
            return new QboSyncResult(QboSyncStatus.Failed, null, ex.Message);
        }
    }

    private async Task<HttpResponseMessage> SendJsonAsync(
        HttpMethod method,
        string url,
        string accessToken,
        string json,
        CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient(nameof(QboCustomerSyncService));
        using var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        return await client.SendAsync(request, ct);
    }

    private static async Task<QboSyncResult> ParseCustomerResponseAsync(
        HttpResponseMessage response,
        CancellationToken ct)
    {
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            var message = FormatQboError((int)response.StatusCode, body);
            return new QboSyncResult(QboSyncStatus.Failed, null, message);
        }

        using var doc = JsonDocument.Parse(body);
        var customerId = doc.RootElement
            .GetProperty("Customer")
            .GetProperty("Id")
            .GetString();

        if (string.IsNullOrEmpty(customerId))
            return new QboSyncResult(QboSyncStatus.Failed, null, "QBO response missing Customer.Id");

        return new QboSyncResult(QboSyncStatus.Synced, customerId, null);
    }

    internal static string FormatQboError(int statusCode, string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("Fault", out var fault)
                && fault.TryGetProperty("Error", out var errors)
                && errors.ValueKind == JsonValueKind.Array)
            {
                foreach (var err in errors.EnumerateArray())
                {
                    var code = err.TryGetProperty("code", out var c) ? c.GetString() : null;
                    var detail = err.TryGetProperty("Detail", out var d) ? d.GetString() : null;
                    var message = err.TryGetProperty("Message", out var m) ? m.GetString() : null;
                    if (code == "6240")
                    {
                        return "QuickBooks error 6240: DisplayName already exists in QuickBooks."
                            + (detail is not null ? $" {detail}" : "");
                    }

                    if (!string.IsNullOrEmpty(message) || !string.IsNullOrEmpty(detail))
                        return $"QBO error {code}: {message ?? detail}";
                }
            }
        }
        catch (JsonException)
        {
            // fall through
        }

        return $"QBO customer request failed: {statusCode} {body}";
    }
}
