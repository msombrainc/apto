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

        try
        {
            var connection = await oauth.EnsureAccessTokenAsync(ct);
            if (string.IsNullOrEmpty(connection.RealmId))
                return new QboSyncResult(QboSyncStatus.Failed, null, "QBO realm id missing.");

            var payload = new
            {
                DisplayName = account.Name,
                CompanyName = account.Code,
            };
            var json = JsonSerializer.Serialize(payload);
            var url =
                $"{_options.ApiBaseUrl.TrimEnd('/')}/v3/company/{connection.RealmId}/customer?minorversion=65";

            var client = httpClientFactory.CreateClient(nameof(QboCustomerSyncService));
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", connection.AccessToken);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            using var response = await client.SendAsync(request, ct);
            var body = await response.Content.ReadAsStringAsync(ct);
            if (!response.IsSuccessStatusCode)
                return new QboSyncResult(
                    QboSyncStatus.Failed,
                    null,
                    $"QBO customer create failed: {(int)response.StatusCode} {body}");

            using var doc = JsonDocument.Parse(body);
            var customerId = doc.RootElement
                .GetProperty("Customer")
                .GetProperty("Id")
                .GetString();

            if (string.IsNullOrEmpty(customerId))
                return new QboSyncResult(QboSyncStatus.Failed, null, "QBO response missing Customer.Id");

            return new QboSyncResult(QboSyncStatus.Synced, customerId, null);
        }
        catch (Exception ex)
        {
            return new QboSyncResult(QboSyncStatus.Failed, null, ex.Message);
        }
    }
}
