using System.Net;
using System.Net.Http.Json;
using Apto.Api.Accounts;
using Apto.Api.Jobs;

namespace Apto.Api.Tests;

public class JobEndpointsTests
{
    [Fact]
    public async Task Post_job_computes_sla_from_account_timers()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Jobs Co", "JOB-CO", 1, 2, 3));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var start = new DateTime(2026, 10, 1, 12, 0, 0, DateTimeKind.Utc);
        var post = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "TX", "intake", start, null));
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var job = await post.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(job);
        Assert.Equal(6, job.SlaTotalDays);
        Assert.Equal("TX", job.FacilityCode);
        Assert.Equal(start.Date.AddDays(6), job.DueDateUtc?.Date);
    }

    [Fact]
    public async Task List_jobs_includes_sla_status()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("SLA", "SLA-1", 0, 0, 0));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var due = DateTime.UtcNow.Date.AddDays(-1);
        await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", "late", DateTime.UtcNow.AddDays(-5), due));

        var listed = await client.GetFromJsonAsync<List<JobResponse>>(
            $"/api/jobs?accountId={createdAccount.Id}");
        Assert.NotNull(listed);
        var job = Assert.Single(listed);
        Assert.Equal("overdue", job.SlaStatus);
        Assert.True(job.DaysRemaining < 0);
    }

    [Fact]
    public async Task Invalid_facility_returns_bad_request()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("X", "X-1", 1, 1, 1));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var post = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(
                createdAccount.Id,
                "NY",
                "x",
                DateTime.UtcNow,
                null));

        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
    }

    [Fact]
    public async Task Put_updates_job_and_recomputes_sla()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Up Co", "UP-CO", 1, 1, 1));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var start = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        var post = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", "draft", start, null));
        var created = await post.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(created);

        var newStart = start.AddDays(2);
        var put = await client.PutAsJsonAsync(
            $"/api/jobs/{created.Id}",
            new JobWriteRequest(createdAccount.Id, "TX", "active", newStart, null));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var updated = await put.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(updated);
        Assert.Equal("TX", updated.FacilityCode);
        Assert.Equal("active", updated.OpsStatus);
        Assert.Equal(newStart.Date.AddDays(3), updated.DueDateUtc?.Date);
    }

    [Fact]
    public async Task Post_rejects_due_before_start()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Bad", "BAD-1", 1, 1, 1));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var start = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc);
        var post = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", "x", start, start.AddDays(-2)));

        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
    }

    [Fact]
    public async Task Facilities_endpoint_returns_seed_codes()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var codes = await client.GetFromJsonAsync<string[]>("/api/jobs/facilities");
        Assert.NotNull(codes);
        Assert.Equal(new[] { "GA", "TX", "CA" }, codes);
    }
}
