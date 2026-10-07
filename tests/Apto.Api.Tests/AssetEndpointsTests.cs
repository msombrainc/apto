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
}
