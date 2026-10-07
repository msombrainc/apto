using System.Net;
using System.Net.Http.Json;
using Apto.Api.Accounts;
using Apto.Api.Assets;
using Apto.Api.Jobs;
using Apto.Api.PartNumbers;

namespace Apto.Api.Tests;

public class AssetEndpointsTests
{
    [Fact]
    public async Task Create_asset_on_job_logs_creation_and_lists_change_log()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Apto-User", "operator-1");

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Asset Co", "AST-1", 1, 1, 1));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", "intake", DateTime.UtcNow, null));
        var createdJob = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        var part = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberWriteRequest("PN-ASSET-1", "Laptops"));
        var createdPart = await part.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(createdPart);

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(createdPart.Id, "SN-100", null));
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var asset = await post.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(asset);
        Assert.Equal("SN-100", asset.SerialNumber);
        Assert.Contains(asset.ChangeLog, e => e.FieldName == "created" && e.ChangedBy == "operator-1");

        var listed = await client.GetFromJsonAsync<List<AssetResponse>>(
            $"/api/jobs/{createdJob.Id}/assets");
        Assert.NotNull(listed);
        Assert.Single(listed);

        var loaded = await client.GetFromJsonAsync<AssetResponse>($"/api/assets/{asset.Id}");
        Assert.NotNull(loaded);
        Assert.True(loaded.ChangeLog.Count >= 2);
    }

    [Fact]
    public async Task Update_asset_serial_appends_change_log()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Edit Co", "ED-1", 0, 0, 0));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "TX", null, DateTime.UtcNow, null));
        var createdJob = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(null, "OLD-SN", "PN-NEW-99"));
        var asset = await post.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(asset);

        var put = await client.PutAsJsonAsync(
            $"/api/assets/{asset.Id}",
            new AssetWriteRequest(null, "NEW-SN", null));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var updated = await put.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(updated);
        Assert.Equal("NEW-SN", updated.SerialNumber);
        Assert.Contains(
            updated.ChangeLog,
            e => e.FieldName == "serialNumber" && e.OldValue == "OLD-SN" && e.NewValue == "NEW-SN");
    }

    [Fact]
    public async Task Update_asset_via_new_part_number_string_appends_change_log()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Str Co", "ST-1", 0, 0, 0));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "TX", null, DateTime.UtcNow, null));
        var createdJob = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(null, "SN-STR", "PN-ORIG"));
        var asset = await post.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(asset);
        Assert.Equal("PN-ORIG", asset.PartNumber);

        var put = await client.PutAsJsonAsync(
            $"/api/assets/{asset.Id}",
            new AssetWriteRequest(null, null, "PN-VIA-STRING"));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var updated = await put.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(updated);
        Assert.Equal("PN-VIA-STRING", updated.PartNumber);
    }

    [Fact]
    public async Task Update_asset_part_number_appends_change_log()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Apto-User", "operator-2");

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Part Co", "PT-1", 0, 0, 0));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "TX", null, DateTime.UtcNow, null));
        var createdJob = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        var firstPart = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberWriteRequest("PN-OLD", "Laptops"));
        var oldPart = await firstPart.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(oldPart);

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(oldPart.Id, "SN-PN", null));
        var asset = await post.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(asset);
        Assert.Equal("PN-OLD", asset.PartNumber);

        var secondPart = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberWriteRequest("PN-NEW", "Laptops"));
        var newPart = await secondPart.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(newPart);

        var put = await client.PutAsJsonAsync(
            $"/api/assets/{asset.Id}",
            new AssetWriteRequest(newPart.Id, null, null));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var updated = await put.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(updated);
        Assert.Equal("PN-NEW", updated.PartNumber);
        Assert.Contains(
            updated.ChangeLog,
            e =>
                e.FieldName == "partNumber"
                && e.OldValue == "PN-OLD"
                && e.NewValue == "PN-NEW"
                && e.ChangedBy == "operator-2");
    }

    [Fact]
    public async Task Create_asset_without_part_number_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Bad", "BAD-1", 0, 0, 0));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", null, DateTime.UtcNow, null));
        var createdJob = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(null, "SN-ONLY", null));
        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
        var body = await post.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(body);
        Assert.Contains("part number", body["error"], StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Create_asset_with_unknown_part_id_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("X", "X-2", 0, 0, 0));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", null, DateTime.UtcNow, null));
        var createdJob = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(Guid.NewGuid(), null, null));
        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
    }

    [Fact]
    public async Task Update_asset_with_unknown_part_id_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Z", "Z-1", 0, 0, 0));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", null, DateTime.UtcNow, null));
        var createdJob = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(null, null, "PN-PUT-UNK"));
        var asset = await post.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(asset);

        var put = await client.PutAsJsonAsync(
            $"/api/assets/{asset.Id}",
            new AssetWriteRequest(Guid.NewGuid(), null, null));
        Assert.Equal(HttpStatusCode.BadRequest, put.StatusCode);
    }

    [Fact]
    public async Task Update_asset_with_no_changes_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Y", "Y-1", 0, 0, 0));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", null, DateTime.UtcNow, null));
        var createdJob = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(null, null, "PN-PUT-1"));
        var asset = await post.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(asset);

        var put = await client.PutAsJsonAsync(
            $"/api/assets/{asset.Id}",
            new AssetWriteRequest(null, null, null));
        Assert.Equal(HttpStatusCode.BadRequest, put.StatusCode);
    }

    [Fact]
    public async Task List_assets_for_missing_job_returns_not_found()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/jobs/{Guid.NewGuid()}/assets");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Create_asset_for_missing_job_returns_not_found()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{Guid.NewGuid()}/assets",
            new AssetWriteRequest(null, null, "PN-MISSING-JOB"));
        Assert.Equal(HttpStatusCode.NotFound, post.StatusCode);
    }

    [Fact]
    public async Task Get_missing_asset_returns_not_found()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/assets/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_missing_asset_returns_not_found()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var put = await client.PutAsJsonAsync(
            $"/api/assets/{Guid.NewGuid()}",
            new AssetWriteRequest(null, "SN", null));
        Assert.Equal(HttpStatusCode.NotFound, put.StatusCode);
    }

    [Fact]
    public async Task Part_number_search_returns_matches()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/part-numbers", new PartNumberWriteRequest("ABC-123", null));
        await client.PostAsJsonAsync("/api/part-numbers", new PartNumberWriteRequest("XYZ-999", null));

        var results = await client.GetFromJsonAsync<List<PartNumberResponse>>("/api/part-numbers?q=abc");
        Assert.NotNull(results);
        Assert.Contains(results, p => p.Number == "ABC-123");
        Assert.DoesNotContain(results, p => p.Number == "XYZ-999");
    }

    [Fact]
    public async Task Create_part_number_with_empty_number_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberWriteRequest("", null));
        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
        var body = await post.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(body);
        Assert.Equal("number is required.", body["error"]);
    }

    [Fact]
    public async Task Create_part_number_with_whitespace_number_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberWriteRequest("   ", null));
        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
        var body = await post.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(body);
        Assert.Equal("number is required.", body["error"]);
    }

    [Fact]
    public async Task Create_part_number_over_max_length_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberWriteRequest(new string('N', 101), null));
        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
        var body = await post.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(body);
        Assert.Equal("number must be at most 100 characters.", body["error"]);
    }
}
