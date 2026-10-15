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
}
