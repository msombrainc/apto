using System.Net;
using System.Net.Http.Json;
using Apto.Api.Accounts;

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

        var listed = await client.GetFromJsonAsync<List<AccountResponse>>("/api/accounts");
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

        var results = await client.GetFromJsonAsync<List<AccountResponse>>("/api/accounts?q=acme");
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

        var results = await client.GetFromJsonAsync<List<AccountResponse>>("/api/accounts?q=beta");
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
}
