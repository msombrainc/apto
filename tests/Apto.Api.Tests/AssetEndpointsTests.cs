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

    [Fact]
    public async Task Inventory_list_filters_by_query_and_account()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var acctA = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Inv A", "INA", 1, 1, 1));
        var accountA = await acctA.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(accountA);

        var acctB = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Inv B", "INB", 1, 1, 1));
        var accountB = await acctB.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(accountB);

        var jobA = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(accountA.Id, "GA", null, DateTime.UtcNow, null));
        var jobB = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(accountB.Id, "TX", null, DateTime.UtcNow, null));
        var createdJobA = await jobA.Content.ReadFromJsonAsync<JobResponse>();
        var createdJobB = await jobB.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJobA);
        Assert.NotNull(createdJobB);

        await client.PostAsJsonAsync(
            $"/api/jobs/{createdJobA.Id}/assets",
            new AssetWriteRequest(null, "FINDME-1", "PN-INV-A"));
        await client.PostAsJsonAsync(
            $"/api/jobs/{createdJobB.Id}/assets",
            new AssetWriteRequest(null, "OTHER-2", "PN-INV-B"));
        await client.PostAsJsonAsync(
            $"/api/jobs/{createdJobA.Id}/assets",
            new AssetWriteRequest(null, "PLAIN-SN", "UNIQUE-PN-27"));

        var all = await client.GetFromJsonAsync<List<AssetInventoryRow>>("/api/assets");
        Assert.NotNull(all);
        Assert.True(all.Count >= 2);

        var bySerial = await client.GetFromJsonAsync<List<AssetInventoryRow>>(
            "/api/assets?q=findme");
        Assert.NotNull(bySerial);
        Assert.Single(bySerial);
        Assert.Equal("FINDME-1", bySerial[0].SerialNumber);
        Assert.Equal("Inv A", bySerial[0].AccountName);

        var byAccount = await client.GetFromJsonAsync<List<AssetInventoryRow>>(
            $"/api/assets?accountId={accountB.Id}");
        Assert.NotNull(byAccount);
        Assert.Single(byAccount);
        Assert.Equal("OTHER-2", byAccount[0].SerialNumber);
        Assert.Equal("TX", byAccount[0].FacilityCode);

        var byPartNumber = await client.GetFromJsonAsync<List<AssetInventoryRow>>(
            "/api/assets?q=unique-pn-27");
        Assert.NotNull(byPartNumber);
        Assert.Single(byPartNumber);
        Assert.Equal("PLAIN-SN", byPartNumber[0].SerialNumber);
        Assert.Equal("UNIQUE-PN-27", byPartNumber[0].PartNumber);
    }

    [Fact]
    public async Task Inventory_list_filters_by_facility_code()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var acct = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Fac Co", "FAC", 1, 1, 1));
        var account = await acct.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(account);

        var jobGa = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(account.Id, "GA", null, DateTime.UtcNow, null));
        var jobTx = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(account.Id, "TX", null, DateTime.UtcNow, null));
        var createdGa = await jobGa.Content.ReadFromJsonAsync<JobResponse>();
        var createdTx = await jobTx.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdGa);
        Assert.NotNull(createdTx);

        await client.PostAsJsonAsync(
            $"/api/jobs/{createdGa.Id}/assets",
            new AssetWriteRequest(null, "GA-SN", "PN-FAC-GA"));
        await client.PostAsJsonAsync(
            $"/api/jobs/{createdTx.Id}/assets",
            new AssetWriteRequest(null, "TX-SN", "PN-FAC-TX"));

        var txOnly = await client.GetFromJsonAsync<List<AssetInventoryRow>>(
            "/api/assets?facilityCode=tx");
        Assert.NotNull(txOnly);
        Assert.Single(txOnly);
        Assert.Equal("TX-SN", txOnly[0].SerialNumber);
        Assert.Equal("TX", txOnly[0].FacilityCode);
    }

    [Fact]
    public async Task Inventory_list_filters_by_job_id()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var acct = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Job Co", "JBC", 1, 1, 1));
        var account = await acct.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(account);

        var jobOne = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(account.Id, "GA", null, DateTime.UtcNow, null));
        var jobTwo = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(account.Id, "GA", null, DateTime.UtcNow, null));
        var createdOne = await jobOne.Content.ReadFromJsonAsync<JobResponse>();
        var createdTwo = await jobTwo.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdOne);
        Assert.NotNull(createdTwo);

        await client.PostAsJsonAsync(
            $"/api/jobs/{createdOne.Id}/assets",
            new AssetWriteRequest(null, "JOB1-SN", "PN-JOB-1"));
        await client.PostAsJsonAsync(
            $"/api/jobs/{createdTwo.Id}/assets",
            new AssetWriteRequest(null, "JOB2-SN", "PN-JOB-2"));

        var slice = await client.GetFromJsonAsync<List<AssetInventoryRow>>(
            $"/api/assets?jobId={createdOne.Id}");
        Assert.NotNull(slice);
        Assert.Single(slice);
        Assert.Equal(createdOne.Id, slice[0].JobId);
        Assert.Equal("JOB1-SN", slice[0].SerialNumber);
    }

    [Fact]
    public async Task Inventory_list_for_job_orders_newest_first()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var acct = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Order Co", "ORD", 1, 1, 1));
        var account = await acct.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(account);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(account.Id, "GA", null, DateTime.UtcNow, null));
        var createdJob = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(null, "OLDER-SN", "PN-ORD-1"));
        await Task.Delay(15);
        await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(null, "NEWER-SN", "PN-ORD-2"));

        var slice = await client.GetFromJsonAsync<List<AssetInventoryRow>>(
            $"/api/assets?jobId={createdJob.Id}");
        Assert.NotNull(slice);
        Assert.Equal(2, slice.Count);
        Assert.Equal("NEWER-SN", slice[0].SerialNumber);
        Assert.Equal("OLDER-SN", slice[1].SerialNumber);
        Assert.True(slice[0].CreatedAtUtc >= slice[1].CreatedAtUtc);
    }

    [Fact]
    public async Task Inventory_list_unfiltered_orders_newest_first()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var acct = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("All Co", "ALL", 1, 1, 1));
        var account = await acct.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(account);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(account.Id, "GA", null, DateTime.UtcNow, null));
        var createdJob = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(null, "ALL-OLDER", "PN-ALL-1"));
        await Task.Delay(15);
        await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(null, "ALL-NEWER", "PN-ALL-2"));

        var all = await client.GetFromJsonAsync<List<AssetInventoryRow>>("/api/assets");
        Assert.NotNull(all);
        var newerIdx = all.FindIndex(r => r.SerialNumber == "ALL-NEWER");
        var olderIdx = all.FindIndex(r => r.SerialNumber == "ALL-OLDER");
        Assert.True(newerIdx >= 0 && olderIdx >= 0);
        Assert.True(newerIdx < olderIdx);
    }
}
