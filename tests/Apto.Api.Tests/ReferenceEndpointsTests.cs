using System.Net;
using System.Net.Http.Json;
using Apto.Api.Accounts;
using Apto.Api.Jobs;
using Apto.Api.ReferenceData;

namespace Apto.Api.Tests;

public class ReferenceEndpointsTests
{
    [Fact]
    public async Task List_facilities_includes_seed_codes()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var res = await client.GetFromJsonAsync<ReferenceListResponse>("/api/reference/facility");
        Assert.NotNull(res);
        var codes = res.Items.Select(i => i.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);
        Assert.Contains("GA", codes);
        Assert.Contains("TX", codes);
        Assert.Contains("CA", codes);
        Assert.All(res.Items, i => Assert.True(i.IsActive));
    }

    [Fact]
    public async Task Jobs_facilities_matches_reference_data()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var facilities = await client.GetFromJsonAsync<List<string>>("/api/jobs/facilities");
        Assert.NotNull(facilities);
        Assert.Contains("GA", facilities);
        Assert.Contains("TX", facilities);
        Assert.Contains("CA", facilities);
    }

    [Fact]
    public async Task Create_location_under_facility()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var facilities = await client.GetFromJsonAsync<ReferenceListResponse>("/api/reference/facility");
        Assert.NotNull(facilities);
        var ga = facilities.Items.First(i => i.Code == "GA");

        var post = await client.PostAsJsonAsync(
            "/api/reference/location",
            new ReferenceWriteRequest("LOC-TEST", "Test Bay", 99, ga.Id, null, null, null));
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var listed = await client.GetFromJsonAsync<ReferenceListResponse>(
            $"/api/reference/location?facilityId={ga.Id}");
        Assert.NotNull(listed);
        Assert.Contains(listed.Items, i => i.Code == "LOC-TEST");
    }

    [Fact]
    public async Task Reject_duplicate_facility_code()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/reference/facility",
            new ReferenceWriteRequest("GA", "Duplicate GA", 1, null, null, null, null));
        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
        var body = await post.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(body);
        Assert.Contains("code", body["error"], StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Asset_status_requires_group()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/reference/asset-status",
            new ReferenceWriteRequest("TST-STAT", "Test Status", 1, null, null, null, null));
        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
    }

    [Fact]
    public async Task Delete_in_use_facility_deactivates()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Ref Co", "REF-CO", 1, 1, 1));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(
                createdAccount.Id,
                "GA",
                "open",
                DateTime.UtcNow,
                null));

        var facilities = await client.GetFromJsonAsync<ReferenceListResponse>("/api/reference/facility");
        var ga = facilities!.Items.First(i => i.Code == "GA");

        var del = await client.DeleteAsync($"/api/reference/facility/{ga.Id}");
        Assert.Equal(HttpStatusCode.OK, del.StatusCode);
        var body = await del.Content.ReadFromJsonAsync<ReferenceItemResponse>();
        Assert.NotNull(body);
        Assert.False(body.IsActive);
        Assert.True(body.InUseCount >= 1);
    }

    [Fact]
    public async Task Job_create_rejects_deactivated_facility_code()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Ref Co 2", "REF-CO-2", 1, 1, 1));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(
                createdAccount.Id,
                "GA",
                "open",
                DateTime.UtcNow,
                null));

        var facilities = await client.GetFromJsonAsync<ReferenceListResponse>("/api/reference/facility");
        var ga = facilities!.Items.First(i => i.Code == "GA");

        var del = await client.DeleteAsync($"/api/reference/facility/{ga.Id}");
        Assert.Equal(HttpStatusCode.OK, del.StatusCode);

        var reject = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(
                createdAccount.Id,
                "GA",
                "open",
                DateTime.UtcNow,
                null));
        Assert.Equal(HttpStatusCode.BadRequest, reject.StatusCode);
        var err = await reject.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(err);
        Assert.Contains("facility", err["error"], StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Seeded_job_statuses_and_locations_match_contract()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var jobStatuses = await client.GetFromJsonAsync<ReferenceListResponse>("/api/reference/job-status");
        Assert.NotNull(jobStatuses);
        Assert.Equal(9, jobStatuses.Items.Count);
        Assert.Equal(
            new[] { "PICKUP-SCHED", "IN-TRANSIT", "RECEIVED", "WIP", "WIP-INPUT-DONE", "OPS-EXC", "OPS-COMPLETE", "COMPLETED", "CANCELED" },
            jobStatuses.Items.OrderBy(i => i.SortOrder).Select(i => i.Code).ToArray());

        var facilities = await client.GetFromJsonAsync<ReferenceListResponse>("/api/reference/facility");
        var ga = facilities!.Items.First(i => i.Code == "GA");
        var locations = await client.GetFromJsonAsync<ReferenceListResponse>(
            $"/api/reference/location?facilityId={ga.Id}");
        Assert.NotNull(locations);
        Assert.Equal(6, locations.Items.Count);
        Assert.Equal(
            new[] { "RECEIVING", "AUDIT-BENCH", "WIPE-ROOM", "SHRED-CAGE", "RECYCLE-BAY", "SELLABLE" },
            locations.Items.OrderBy(i => i.SortOrder).Select(i => i.Code).ToArray());
    }

    [Fact]
    public async Task Categories_list_returns_part_number_counts()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var res = await client.GetFromJsonAsync<CategoryListResponse>("/api/categories");
        Assert.NotNull(res);
        Assert.All(res.Items, i => Assert.True(i.PartNumberCount >= 0));
    }

    [Fact]
    public async Task Unknown_reference_type_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var res = await client.GetAsync("/api/reference/not-a-type");
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Location_list_without_facilityId_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var res = await client.GetAsync("/api/reference/location");
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Delete_unused_grade_returns_no_content()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/reference/grade",
            new ReferenceWriteRequest("DEL-GRD", "Delete me grade", 99, null, null, null, null));
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        var created = await post.Content.ReadFromJsonAsync<ReferenceItemResponse>();
        Assert.NotNull(created);

        var del = await client.DeleteAsync($"/api/reference/grade/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);
    }

    [Fact]
    public async Task Duplicate_category_name_returns_conflict()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var first = await client.PostAsJsonAsync("/api/categories", new { name = "UniqueCat-46" });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/categories", new { name = "UniqueCat-46" });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Put_reference_item_updates_persisted_fields()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            "/api/reference/grade",
            new ReferenceWriteRequest("PUT-GRD", "Before rename", 10, null, null, null, null));
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        var created = await post.Content.ReadFromJsonAsync<ReferenceItemResponse>();
        Assert.NotNull(created);

        var put = await client.PutAsJsonAsync(
            $"/api/reference/grade/{created.Id}",
            new ReferenceWriteRequest("PUT-GRD", "After rename", 42, null, null, null, false));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var updated = await put.Content.ReadFromJsonAsync<ReferenceItemResponse>();
        Assert.NotNull(updated);
        Assert.Equal("After rename", updated.Name);
        Assert.Equal(42, updated.SortOrder);
        Assert.False(updated.IsActive);

        var listed = await client.GetFromJsonAsync<ReferenceListResponse>(
            "/api/reference/grade?includeInactive=true");
        Assert.NotNull(listed);
        var row = listed.Items.Single(i => i.Id == created.Id);
        Assert.Equal("After rename", row.Name);
        Assert.Equal(42, row.SortOrder);
        Assert.False(row.IsActive);
    }

    [Fact]
    public async Task Put_category_duplicate_name_returns_conflict()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var alpha = await client.PostAsJsonAsync("/api/categories", new { name = "CatAlpha-46" });
        Assert.Equal(HttpStatusCode.Created, alpha.StatusCode);
        var alphaBody = await alpha.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(alphaBody);

        var beta = await client.PostAsJsonAsync("/api/categories", new { name = "CatBeta-46" });
        Assert.Equal(HttpStatusCode.Created, beta.StatusCode);
        var betaBody = await beta.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(betaBody);

        var put = await client.PutAsJsonAsync(
            $"/api/categories/{betaBody.Id}",
            new CategoryWriteRequest("CatAlpha-46", null));
        Assert.Equal(HttpStatusCode.Conflict, put.StatusCode);
        var err = await put.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(err);
        Assert.Contains("already exists", err["error"], StringComparison.OrdinalIgnoreCase);
    }
}
