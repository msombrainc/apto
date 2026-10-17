using System.Net;
using System.Net.Http.Json;
using Apto.Api.Accounts;
using Apto.Api.Assets;
using Apto.Api.Jobs;
using Apto.Api.PartNumbers;

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
            new JobWriteRequest(createdAccount.Id, "TX", "WIP", start, null));
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
            new JobWriteRequest(createdAccount.Id, "GA", "WIP", DateTime.UtcNow.AddDays(-5), due));

        var listed = await client.GetFromJsonAsync<List<JobResponse>>(
            $"/api/jobs?accountId={createdAccount.Id}");
        Assert.NotNull(listed);
        var job = Assert.Single(listed);
        Assert.Equal("overdue", job.SlaStatus);
        Assert.True(job.DaysRemaining < 0);
        Assert.Equal("SLA-1", job.AccountCode);
        Assert.Equal(0, job.ProgressPercent);
    }

    [Fact]
    public async Task List_jobs_includes_asset_count_buckets()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Counts Co", "CNT-1", 1, 1, 1));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var jobPost = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(
                createdAccount.Id,
                "GA",
                "WIP",
                DateTime.UtcNow.AddDays(-2),
                null));
        var createdJob = await jobPost.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        var listed = await client.GetFromJsonAsync<List<JobResponse>>("/api/jobs");
        Assert.NotNull(listed);
        var row = Assert.Single(listed, j => j.Id == createdJob.Id);
        Assert.Equal(0, row.WipAssetCount);
        Assert.Equal(0, row.FinishedAssetCount);
        Assert.True(row.DaysSinceStart >= 2);
    }

    [Fact]
    public async Task List_jobs_progress_reflects_finished_assets()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Prog Co", "PRG-1", 1, 1, 1));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var jobPost = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", "WIP", DateTime.UtcNow, null));
        var createdJob = await jobPost.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);

        var part = await client.PostAsJsonAsync(
            "/api/part-numbers",
            new PartNumberWriteRequest("PN-PRG-1", "Cat"));
        var createdPart = await part.Content.ReadFromJsonAsync<PartNumberResponse>();
        Assert.NotNull(createdPart);

        var assetPost = await client.PostAsJsonAsync(
            $"/api/jobs/{createdJob.Id}/assets",
            new AssetWriteRequest(createdPart.Id, "SN-PRG", null, Status: "RECEIVED"));
        var createdAsset = await assetPost.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(createdAsset);

        var listed = await client.GetFromJsonAsync<List<JobResponse>>("/api/jobs");
        Assert.NotNull(listed);
        var row = Assert.Single(listed, j => j.Id == createdJob.Id);
        Assert.Equal(1, row.WipAssetCount);
        Assert.Equal(0, row.FinishedAssetCount);
        Assert.Equal(0, row.ExceptionAssetCount);
        Assert.Equal(0, row.ProgressPercent);

        var put = await client.PutAsJsonAsync(
            $"/api/assets/{createdAsset.Id}",
            new AssetWriteRequest(null, null, null, Status: "RECYCLED"));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var afterFinished = await client.GetFromJsonAsync<List<JobResponse>>("/api/jobs");
        Assert.NotNull(afterFinished);
        var finishedRow = Assert.Single(afterFinished, j => j.Id == createdJob.Id);
        Assert.Equal(0, finishedRow.WipAssetCount);
        Assert.Equal(1, finishedRow.FinishedAssetCount);
        Assert.Equal(100, finishedRow.ProgressPercent);
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
            new JobWriteRequest(createdAccount.Id, "GA", "WIP", start, null));
        var created = await post.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(created);

        var newStart = start.AddDays(2);
        var put = await client.PutAsJsonAsync(
            $"/api/jobs/{created.Id}",
            new JobWriteRequest(createdAccount.Id, "TX", "Received", newStart, null));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var updated = await put.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(updated);
        Assert.Equal("TX", updated.FacilityCode);
        Assert.Equal("Received", updated.OpsStatus);
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
            new JobWriteRequest(createdAccount.Id, "GA", "WIP", start, start.AddDays(-2)));

        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
    }

    [Fact]
    public async Task Put_rejects_invalid_ops_status()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Ops Put", "OPS-P", 1, 1, 1));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var start = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        var post = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", "WIP", start, null));
        var created = await post.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(created);

        var put = await client.PutAsJsonAsync(
            $"/api/jobs/{created.Id}",
            new JobWriteRequest(createdAccount.Id, "GA", "not-valid", start, null));
        Assert.Equal(HttpStatusCode.BadRequest, put.StatusCode);
    }

    [Fact]
    public async Task Post_rejects_invalid_ops_status()
    {
        await using var factory = new AptoWebApplicationFactory();
        var client = factory.CreateClient();

        var account = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Ops", "OPS-1", 1, 1, 1));
        var createdAccount = await account.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        var post = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(createdAccount.Id, "GA", "not-valid", DateTime.UtcNow, null));
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
