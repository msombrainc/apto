using System.Net;
using System.Net.Http.Json;
using Apto.Api.Accounts;
using Apto.Api.Assets;
using Apto.Api.Jobs;
using Apto.Api.PartNumbers;

namespace Apto.Api.Tests;

public class PartNumberAdminEndpointsTests
{
    [Fact]
    public async Task List_paged_returns_totals_and_asset_counts()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-LIST-1", null));
        await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-LIST-2", null));

        var res = await client.GetFromJsonAsync<PartNumberListResponse>(
            "/api/part-numbers?page=1&pageSize=50&sortBy=number&sortDir=asc");
        Assert.NotNull(res);
        Assert.True(res.Total >= 2);
        Assert.Contains(res.Items, i => i.Number == "PN-LIST-1");
        Assert.All(res.Items, i => Assert.True(i.AssetCount >= 0));
    }

    [Fact]
    public async Task Put_updates_number_and_category()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var cat = await client.PostAsJsonAsync(
            "/api/categories",
            new { name = "PutTestCat" });
        var catBody = await cat.Content.ReadFromJsonAsync<CategoryStub>();
        Assert.NotNull(catBody);

        var created = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-PUT-1", catBody.Id));
        var body = await created.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(body);

        var updated = await client.PutAsJsonAsync(
            $"/api/part-numbers/{body.Id}",
            new PartNumberAdminWriteRequest("PN-PUT-1-RENAMED", null));
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var row = await updated.Content.ReadFromJsonAsync<PartNumberRowResponse>();
        Assert.NotNull(row);
        Assert.Equal("PN-PUT-1-RENAMED", row.Number);
        Assert.Null(row.CategoryName);
    }

    [Fact]
    public async Task Put_not_found_returns_404()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var missing = await client.PutAsJsonAsync(
            $"/api/part-numbers/{Guid.NewGuid()}",
            new PartNumberAdminWriteRequest("PN-MISSING", null));
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task Put_invalid_category_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var created = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-BAD-CAT", null));
        var body = await created.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(body);

        var bad = await client.PutAsJsonAsync(
            $"/api/part-numbers/{body.Id}",
            new PartNumberAdminWriteRequest("PN-BAD-CAT", Guid.NewGuid()));
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
    }

    [Fact]
    public async Task Put_duplicate_number_returns_conflict()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-DUP-A", null));
        var second = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-DUP-B", null));
        var b = await second.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(b);

        var conflict = await client.PutAsJsonAsync(
            $"/api/part-numbers/{b.Id}",
            new PartNumberAdminWriteRequest("PN-DUP-A", null));
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
    }

    [Fact]
    public async Task List_sorts_by_category_name_asc_and_desc()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var catA = await client.PostAsJsonAsync("/api/categories", new { name = "SortCat-Alpha" });
        var catABody = await catA.Content.ReadFromJsonAsync<CategoryStub>();
        Assert.NotNull(catABody);
        var catZ = await client.PostAsJsonAsync("/api/categories", new { name = "SortCat-Zulu" });
        var catZBody = await catZ.Content.ReadFromJsonAsync<CategoryStub>();
        Assert.NotNull(catZBody);

        await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-SORT-CAT-Z", catZBody.Id));
        await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-SORT-CAT-A", catABody.Id));

        var asc = await client.GetFromJsonAsync<PartNumberListResponse>(
            "/api/part-numbers?page=1&pageSize=50&q=PN-SORT-CAT&sortBy=categoryName&sortDir=asc");
        Assert.NotNull(asc);
        var ascNames = asc.Items.Select(i => i.CategoryName ?? "").ToList();
        Assert.Equal(2, ascNames.Count);
        Assert.True(string.Compare(ascNames[0], ascNames[1], StringComparison.Ordinal) <= 0);

        var desc = await client.GetFromJsonAsync<PartNumberListResponse>(
            "/api/part-numbers?page=1&pageSize=50&q=PN-SORT-CAT&sortBy=categoryName&sortDir=desc");
        Assert.NotNull(desc);
        var descNames = desc.Items.Select(i => i.CategoryName ?? "").ToList();
        Assert.Equal(2, descNames.Count);
        Assert.True(string.Compare(descNames[0], descNames[1], StringComparison.Ordinal) >= 0);
    }

    [Fact]
    public async Task List_sorts_by_asset_count_asc_and_desc()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var heavy = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-SORT-AC-HEAVY", null));
        var heavyBody = await heavy.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(heavyBody);
        var light = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-SORT-AC-LIGHT", null));
        var lightBody = await light.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(lightBody);

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Sort AC Co", "SORTAC", 1, 1, 1));
        var acct = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(acct);
        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(acct.Id, "GA", "Receiving", DateTime.UtcNow, null));
        var jobBody = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(jobBody);

        for (var i = 0; i < 2; i++)
        {
            var asset = await client.PostAsJsonAsync(
                $"/api/jobs/{jobBody.Id}/assets",
                new AssetWriteRequest(heavyBody.Id, $"SN-HEAVY-{i}", null));
            Assert.Equal(HttpStatusCode.Created, asset.StatusCode);
        }

        var asc = await client.GetFromJsonAsync<PartNumberListResponse>(
            "/api/part-numbers?page=1&pageSize=50&q=PN-SORT-AC&sortBy=assetCount&sortDir=asc");
        Assert.NotNull(asc);
        Assert.Equal(2, asc.Items.Count);
        Assert.Equal("PN-SORT-AC-LIGHT", asc.Items[0].Number);
        Assert.Equal(0, asc.Items[0].AssetCount);
        Assert.Equal("PN-SORT-AC-HEAVY", asc.Items[1].Number);
        Assert.Equal(2, asc.Items[1].AssetCount);

        var desc = await client.GetFromJsonAsync<PartNumberListResponse>(
            "/api/part-numbers?page=1&pageSize=50&q=PN-SORT-AC&sortBy=assetCount&sortDir=desc");
        Assert.NotNull(desc);
        Assert.Equal(2, desc.Items.Count);
        Assert.Equal("PN-SORT-AC-HEAVY", desc.Items[0].Number);
        Assert.Equal(2, desc.Items[0].AssetCount);
    }

    [Fact]
    public async Task Admin_create_invalid_category_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var bad = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-BAD-CAT-POST", Guid.NewGuid()));
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
    }

    [Fact]
    public async Task Admin_create_duplicate_returns_conflict()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("DUP-ADMIN-1", null));

        var dup = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("DUP-ADMIN-1", null));
        Assert.Equal(HttpStatusCode.Conflict, dup.StatusCode);
    }

    [Fact]
    public async Task Delete_with_assets_requires_replacement_and_logs()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var oldPart = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-OLD-DEL", null));
        var oldBody = await oldPart.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(oldBody);

        var newPart = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-NEW-DEL", null));
        var newBody = await newPart.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(newBody);

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("PN Del Co", "PNDEL", 1, 1, 1));
        var acct = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(acct);

        var job = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(acct.Id, "GA", "Receiving", DateTime.UtcNow, null));
        var jobBody = await job.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(jobBody);

        var asset = await client.PostAsJsonAsync(
            $"/api/jobs/{jobBody.Id}/assets",
            new AssetWriteRequest(oldBody.Id, "SN-PN-DEL", null));
        Assert.Equal(HttpStatusCode.Created, asset.StatusCode);
        var assetBody = await asset.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(assetBody);

        var missingReplacement = await client.DeleteAsync($"/api/part-numbers/{oldBody.Id}");
        Assert.Equal(HttpStatusCode.BadRequest, missingReplacement.StatusCode);

        var deleted = await client.DeleteAsync(
            $"/api/part-numbers/{oldBody.Id}?replacementId={newBody.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);

        var updated = await client.GetFromJsonAsync<AssetResponse>($"/api/assets/{assetBody.Id}");
        Assert.NotNull(updated);
        Assert.Equal("PN-NEW-DEL", updated.PartNumber);
        Assert.Contains(
            updated.ChangeLog,
            l => l.FieldName == "partNumber"
                 && l.OldValue == "PN-OLD-DEL"
                 && l.NewValue == "PN-NEW-DEL");
    }

    [Fact]
    public async Task Delete_without_assets_succeeds_without_replacement()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var created = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberAdminWriteRequest("PN-ZERO-ASSETS", null));
        var body = await created.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(body);

        var deleted = await client.DeleteAsync($"/api/part-numbers/{body.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);

        var get = await client.GetAsync($"/api/part-numbers?page=1&q=PN-ZERO-ASSETS");
        var list = await get.Content.ReadFromJsonAsync<PartNumberListResponse>();
        Assert.NotNull(list);
        Assert.DoesNotContain(list.Items, i => i.Id == body.Id);
    }

    private sealed record CategoryStub(Guid Id, string Name);
}
