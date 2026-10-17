using System.Net;
using System.Net.Http.Json;
using Apto.Api.Accounts;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.QuickBooks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Apto.Api.Tests;

public class AccountEndpointsTests
{
    [Fact]
    public async Task Post_then_get_lists_account()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var create = new AccountWriteRequest("Acme Corp", "ACME-01", 1, 2, 3);
        var post = await client.PostAsJsonAsync("/api/accounts", create);
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var created = await post.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(created);
        Assert.Equal("skipped", created.QboSyncStatus);

        var listed = await client.GetFromJsonAsync<List<AccountResponse>>("/api/accounts?status=Both");
        Assert.NotNull(listed);
        Assert.Contains(listed, a => a.Code == "ACME-01" && a.Name == "Acme Corp");
    }

    [Fact]
    public async Task Duplicate_code_returns_conflict()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/accounts", new AccountWriteRequest("One", "DUP", 0, 0, 0));
        var second = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Two", "DUP", 0, 0, 0));

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Search_filters_by_name_only()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Acme Corporation", "ZZZ-ONLY", 0, 0, 0));
        await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Other LLC", "OTHER", 0, 0, 0));

        var results = await client.GetFromJsonAsync<List<AccountResponse>>("/api/accounts?status=Both&q=acme");
        Assert.NotNull(results);
        Assert.Single(results);
        Assert.Equal("ZZZ-ONLY", results[0].Code);
    }

    [Fact]
    public async Task Search_filters_by_code()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/accounts", new AccountWriteRequest("Beta LLC", "BETA", 0, 0, 0));
        await client.PostAsJsonAsync("/api/accounts", new AccountWriteRequest("Gamma Inc", "GAMMA", 0, 0, 0));

        var results = await client.GetFromJsonAsync<List<AccountResponse>>("/api/accounts?status=Both&q=beta");
        Assert.NotNull(results);
        Assert.Single(results);
        Assert.Equal("BETA", results[0].Code);
    }

    [Fact]
    public async Task Put_updates_account()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var created = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Old Name", "OLD", 1, 1, 1));
        var body = await created.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(body);

        var updated = await client.PutAsJsonAsync(
            $"/api/accounts/{body.Id}",
            new AccountWriteRequest("New Name", "OLD", 2, 3, 4));
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);

        var fetched = await updated.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.Equal("New Name", fetched!.Name);
        Assert.Equal(2, fetched.SlaReceivingDays);
    }

    [Fact]
    public async Task Post_invalid_name_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("", "X", 0, 0, 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_invalid_code_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Valid", "  ", 0, 0, 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_name_over_max_length_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var tooLongName = new string('n', 201);
        var response = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest(tooLongName, "OK", 0, 0, 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_code_over_max_length_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var tooLongCode = new string('c', 51);
        var response = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Valid", tooLongCode, 0, 0, 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_name_over_max_length_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var created = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Valid", "MAXLEN", 0, 0, 0));
        var body = await created.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(body);

        var tooLongName = new string('n', 201);
        var response = await client.PutAsJsonAsync(
            $"/api/accounts/{body.Id}",
            new AccountWriteRequest(tooLongName, "MAXLEN", 0, 0, 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_code_over_max_length_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var created = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Valid", "PUTMAX", 0, 0, 0));
        var body = await created.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(body);

        var tooLongCode = new string('c', 51);
        var response = await client.PutAsJsonAsync(
            $"/api/accounts/{body.Id}",
            new AccountWriteRequest("Valid", tooLongCode, 0, 0, 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_negative_sla_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Valid", "CODE", 0, -1, 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_invalid_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var created = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Valid", "V1", 0, 0, 0));
        var body = await created.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(body);

        var response = await client.PutAsJsonAsync(
            $"/api/accounts/{body.Id}",
            new AccountWriteRequest("", "V1", 0, 0, 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_duplicate_code_returns_conflict()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/accounts", new AccountWriteRequest("A", "CODE-A", 0, 0, 0));
        var second = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("B", "CODE-B", 0, 0, 0));
        var b = await second.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(b);

        var conflict = await client.PutAsJsonAsync(
            $"/api/accounts/{b.Id}",
            new AccountWriteRequest("B", "CODE-A", 0, 0, 0));

        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
    }

    [Fact]
    public async Task Put_missing_returns_not_found()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PutAsJsonAsync(
            $"/api/accounts/{Guid.NewGuid()}",
            new AccountWriteRequest("X", "Y", 0, 0, 0));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_by_id_returns_account_with_settings()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Detail Co", "DET-01", 30, 30, 60));
        var created = await post.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(created);

        var get = await client.GetFromJsonAsync<AccountResponse>($"/api/accounts/{created.Id}");
        Assert.NotNull(get);
        Assert.Equal("Active", get.Status);
        Assert.Equal(0, get.Settings.AptoPercentage);
    }

    [Fact]
    public async Task Get_unknown_returns_not_found()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/accounts/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_writes_change_log_for_name()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Before", "CHG-01", 1, 1, 1));
        var created = await post.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(created);

        await client.PutAsJsonAsync(
            $"/api/accounts/{created.Id}",
            new AccountWriteRequest("After", "CHG-01", 1, 1, 1));

        var changes = await client.GetFromJsonAsync<AccountChangeLogListResponse>(
            $"/api/accounts/{created.Id}/changes");
        Assert.NotNull(changes);
        Assert.Contains(changes.Items, c => c.FieldName == "Name" && c.NewValue == "After");
    }

    [Fact]
    public async Task Put_writes_change_log_for_settings_leaf()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Pct Co", "PCT-LOG", 1, 1, 1));
        var created = await post.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(created);

        var settings = new AccountSettingsDto { AptoPercentage = 12.5m };
        await client.PutAsJsonAsync(
            $"/api/accounts/{created.Id}",
            new AccountWriteRequest("Pct Co", "PCT-LOG", 1, 1, 1, Settings: settings));

        var changes = await client.GetFromJsonAsync<AccountChangeLogListResponse>(
            $"/api/accounts/{created.Id}/changes");
        Assert.NotNull(changes);
        Assert.Contains(
            changes.Items,
            c => c.FieldName.Contains("aptoPercentage", StringComparison.OrdinalIgnoreCase)
                && c.NewValue == "12.5");
    }

    [Fact]
    public async Task List_default_status_excludes_inactive()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var active = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Active Co", "DEF-ACT", 0, 0, 0, Status: "Active"));
        var inactive = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Inactive Co", "DEF-INA", 0, 0, 0, Status: "Inactive"));
        Assert.Equal(HttpStatusCode.Created, active.StatusCode);
        Assert.Equal(HttpStatusCode.Created, inactive.StatusCode);

        var listed = await client.GetFromJsonAsync<List<AccountResponse>>("/api/accounts");
        Assert.NotNull(listed);
        Assert.Contains(listed, a => a.Code == "DEF-ACT");
        Assert.DoesNotContain(listed, a => a.Code == "DEF-INA");
    }

    [Fact]
    public async Task List_status_filter_inactive()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var active = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Active Co", "ACT-1", 0, 0, 0, Status: "Active"));
        var inactive = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Inactive Co", "INA-1", 0, 0, 0, Status: "Inactive"));
        Assert.Equal(HttpStatusCode.Created, active.StatusCode);
        Assert.Equal(HttpStatusCode.Created, inactive.StatusCode);

        var listed = await client.GetFromJsonAsync<List<AccountResponse>>("/api/accounts?status=Inactive");
        Assert.NotNull(listed);
        Assert.All(listed, a => Assert.Equal("Inactive", a.Status));
        Assert.Contains(listed, a => a.Code == "INA-1");
        Assert.DoesNotContain(listed, a => a.Code == "ACT-1");
    }

    [Fact]
    public async Task Put_without_settings_preserves_existing_settings()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Keep Pct", "KEEP-PCT", 1, 1, 1));
        var created = await post.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(created);

        var settings = new AccountSettingsDto { AptoPercentage = 42.5m };
        await client.PutAsJsonAsync(
            $"/api/accounts/{created.Id}",
            new AccountWriteRequest("Keep Pct", "KEEP-PCT", 1, 1, 1, Settings: settings));

        var scalarOnly = await client.PutAsJsonAsync(
            $"/api/accounts/{created.Id}",
            new AccountWriteRequest("Renamed Only", "KEEP-PCT", 2, 3, 4));
        Assert.Equal(HttpStatusCode.OK, scalarOnly.StatusCode);

        var fetched = await scalarOnly.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(fetched);
        Assert.Equal("Renamed Only", fetched.Name);
        Assert.Equal(42.5m, fetched.Settings.AptoPercentage);
    }

    [Fact]
    public async Task List_status_filter_is_case_insensitive()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Active Co", "CASE-ACT", 0, 0, 0, Status: "Active"));
        await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Inactive Co", "CASE-INA", 0, 0, 0, Status: "Inactive"));

        var listed = await client.GetFromJsonAsync<List<AccountResponse>>("/api/accounts?status=inactive");
        Assert.NotNull(listed);
        Assert.Contains(listed, a => a.Code == "CASE-INA");
        Assert.DoesNotContain(listed, a => a.Code == "CASE-ACT");
    }

    [Fact]
    public async Task Put_invalid_apto_percentage_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Valid", "PCT-1", 0, 0, 0));
        var created = await post.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(created);

        var badSettings = new AccountSettingsDto { AptoPercentage = 150 };
        var response = await client.PutAsJsonAsync(
            $"/api/accounts/{created.Id}",
            new AccountWriteRequest("Valid", "PCT-1", 0, 0, 0, Settings: badSettings));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_changes_unknown_account_returns_not_found()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/accounts/{Guid.NewGuid()}/changes");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_changes_supports_pagination_and_page_size_cap()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Paginate", "PAG-01", 1, 1, 1));
        var created = await post.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(created);

        for (var i = 1; i <= 3; i++)
        {
            await client.PutAsJsonAsync(
                $"/api/accounts/{created.Id}",
                new AccountWriteRequest($"Name {i}", "PAG-01", 1, 1, 1));
        }

        var page1 = await client.GetFromJsonAsync<AccountChangeLogListResponse>(
            $"/api/accounts/{created.Id}/changes?page=1&pageSize=2");
        Assert.NotNull(page1);
        Assert.Equal(1, page1.Page);
        Assert.Equal(2, page1.PageSize);
        Assert.Equal(3, page1.Total);
        Assert.Equal(2, page1.Items.Count);

        var capped = await client.GetFromJsonAsync<AccountChangeLogListResponse>(
            $"/api/accounts/{created.Id}/changes?pageSize=500");
        Assert.NotNull(capped);
        Assert.Equal(100, capped.PageSize);
    }

    [Fact]
    public async Task Get_changes_filters_by_field_and_date_range()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Filter Co", "FLT-01", 1, 1, 1));
        var created = await post.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(created);

        await client.PutAsJsonAsync(
            $"/api/accounts/{created.Id}",
            new AccountWriteRequest("Renamed", "FLT-01", 1, 1, 1));

        var settings = new AccountSettingsDto { AptoPercentage = 5m };
        await client.PutAsJsonAsync(
            $"/api/accounts/{created.Id}",
            new AccountWriteRequest("Renamed", "FLT-01", 1, 1, 1, Settings: settings));

        var nameOnly = await client.GetFromJsonAsync<AccountChangeLogListResponse>(
            $"/api/accounts/{created.Id}/changes?field=Name");
        Assert.NotNull(nameOnly);
        Assert.All(nameOnly.Items, c => Assert.Equal("Name", c.FieldName));
        Assert.Contains(nameOnly.Items, c => c.NewValue == "Renamed");

        var from = DateTime.UtcNow.AddHours(-1).ToString("O");
        var to = DateTime.UtcNow.AddHours(1).ToString("O");
        var inRange = await client.GetFromJsonAsync<AccountChangeLogListResponse>(
            $"/api/accounts/{created.Id}/changes?from={Uri.EscapeDataString(from)}&to={Uri.EscapeDataString(to)}");
        Assert.NotNull(inRange);
        Assert.True(inRange.Total >= 2);
    }

    [Fact]
    public async Task List_invalid_status_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/accounts?status=not-a-status");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("status must be Active, Inactive, or Both", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Get_by_id_returns_qbo_last_sync_from_most_recent_sent_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("QBO Sync Co", "QBO-SYNC", 1, 1, 1));
        var created = await post.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(created);

        var olderSent = DateTime.UtcNow.AddDays(-2);
        var newerSent = DateTime.UtcNow.AddHours(-1);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
            db.QboSyncRequests.AddRange(
                new QboSyncRequest
                {
                    Id = Guid.NewGuid(),
                    Operation = QboSyncOperations.CreateCustomer,
                    EntityType = QboSyncEntityTypes.Account,
                    EntityId = created.Id,
                    PayloadJson = "{}",
                    Status = QboSyncRequestStatus.Sent,
                    Attempts = 1,
                    CreatedAtUtc = olderSent,
                    UpdatedAtUtc = olderSent,
                    SentAtUtc = olderSent,
                },
                new QboSyncRequest
                {
                    Id = Guid.NewGuid(),
                    Operation = QboSyncOperations.UpdateCustomer,
                    EntityType = QboSyncEntityTypes.Account,
                    EntityId = created.Id,
                    PayloadJson = "{}",
                    Status = QboSyncRequestStatus.Sent,
                    Attempts = 1,
                    CreatedAtUtc = newerSent,
                    UpdatedAtUtc = newerSent,
                    SentAtUtc = newerSent,
                });
            await db.SaveChangesAsync();
        }

        var fetched = await client.GetFromJsonAsync<AccountResponse>($"/api/accounts/{created.Id}");
        Assert.NotNull(fetched);
        Assert.NotNull(fetched.QboLastSyncAtUtc);
        Assert.Equal(newerSent, fetched.QboLastSyncAtUtc.Value, TimeSpan.FromSeconds(1));
    }
}
