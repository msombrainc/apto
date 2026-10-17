using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Apto.Api.Accounts;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.Jobs;
using Apto.Api.QuickBooks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Apto.Api.Tests;

public class JobInvoiceEndpointsTests
{
    private static async Task<(Guid JobId, Guid AccountId)> SeedJobWithFeesAsync(
        AptoWebApplicationFactory factory,
        bool withQboCustomer = true)
    {
        var client = factory.CreateClient();
        var settings = new AccountSettingsDto
        {
            Fees = new AccountFeesDto { Audit = 10m, Wipe = 5m },
        };
        var accountPost = await client.PostAsJsonAsync(
            "/api/accounts",
            new AccountWriteRequest("Invoice Co", "INV-01", 1, 1, 1, Settings: settings));
        var createdAccount = await accountPost.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(createdAccount);

        if (withQboCustomer)
        {
            await using var scope = factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
            var row = await db.Accounts.SingleAsync(a => a.Id == createdAccount.Id);
            row.QboCustomerId = "qbo-cust-1";
            await db.SaveChangesAsync();
        }

        var jobPost = await client.PostAsJsonAsync(
            "/api/jobs",
            new JobWriteRequest(
                createdAccount.Id,
                "TX",
                "WIP",
                DateTime.UtcNow.AddDays(-1),
                null));
        var createdJob = await jobPost.Content.ReadFromJsonAsync<JobResponse>();
        Assert.NotNull(createdJob);
        return (createdJob.Id, createdAccount.Id);
    }

    [Fact]
    public async Task Invoice_preview_returns_lines_from_account_fees()
    {
        await using var factory = new AptoWebApplicationFactory();
        var (jobId, _) = await SeedJobWithFeesAsync(factory);
        var client = factory.CreateClient();

        var res = await client.GetAsync($"/api/jobs/{jobId}/invoice-preview");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Invoice Co", json.GetProperty("accountName").GetString());
        Assert.Equal("qbo-cust-1", json.GetProperty("qboCustomerId").GetString());
        var lines = json.GetProperty("lines");
        Assert.True(lines.GetArrayLength() >= 1);
    }

    [Fact]
    public async Task Create_invoice_without_qbo_customer_returns_400()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "c";
            o.ClientSecret = "s";
        });
        var (jobId, _) = await SeedJobWithFeesAsync(factory, withQboCustomer: false);
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{jobId}/invoices",
            new CreateServiceInvoiceRequest
            {
                Lines = [new CreateServiceInvoiceLine { ServiceKey = "audit", Quantity = 1 }],
            });
        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
        var body = await post.Content.ReadAsStringAsync();
        Assert.Contains("qbo_customer_missing", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Create_invoice_all_zero_qty_returns_400()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "c";
            o.ClientSecret = "s";
        });
        var (jobId, _) = await SeedJobWithFeesAsync(factory);
        var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{jobId}/invoices",
            new CreateServiceInvoiceRequest
            {
                Lines = [new CreateServiceInvoiceLine { ServiceKey = "audit", Quantity = 0 }],
            });
        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
    }

    [Fact]
    public async Task Create_invoice_enqueues_sync_and_lists_history()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "c";
            o.ClientSecret = "s";
            o.RedirectUri = "http://localhost/callback";
        });
        var (jobId, accountId) = await SeedJobWithFeesAsync(factory);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        db.QboConnections.Add(new QboConnection
        {
            Id = QboConnection.SingletonId,
            RealmId = "r1",
            AccessToken = "tok",
            RefreshToken = "ref",
            AccessTokenExpiresAtUtc = DateTime.UtcNow.AddHours(1),
            UpdatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var client = factory.CreateClient();
        var post = await client.PostAsJsonAsync(
            $"/api/jobs/{jobId}/invoices",
            new CreateServiceInvoiceRequest
            {
                Note = "Demo invoice",
                Lines = [new CreateServiceInvoiceLine { ServiceKey = "audit", Quantity = 2 }],
            });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var sync = await db.QboSyncRequests.AsNoTracking()
            .FirstAsync(r => r.EntityType == QboSyncEntityTypes.ServiceInvoice);
        Assert.Equal(QboSyncOperations.CreateInvoice, sync.Operation);
        Assert.Equal(QboSyncRequestStatus.Pending, sync.Status);

        var list = await client.GetFromJsonAsync<JsonElement[]>($"/api/jobs/{jobId}/invoices");
        Assert.NotNull(list);
        var row = Assert.Single(list!);
        Assert.Equal("Queued", row.GetProperty("status").GetString());
        Assert.Equal(20m, row.GetProperty("total").GetDecimal());
    }

    [Fact]
    public async Task Processor_marks_service_invoice_and_sync_sent()
    {
        await using var factory = new AptoWebApplicationFactory(o =>
        {
            o.ClientId = "c";
            o.ClientSecret = "s";
        });
        var (jobId, accountId) = await SeedJobWithFeesAsync(factory);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AptoDbContext>();
        var invoiceId = Guid.NewGuid();
        db.QboSyncRequests.RemoveRange(await db.QboSyncRequests.ToListAsync());
        db.ServiceInvoices.Add(new ServiceInvoice
        {
            Id = invoiceId,
            JobId = jobId,
            AccountId = accountId,
            LinesJson = "[]",
            Total = 10m,
            Status = "Queued",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        });
        db.QboSyncRequests.Add(new QboSyncRequest
        {
            Id = Guid.NewGuid(),
            Operation = QboSyncOperations.CreateInvoice,
            EntityType = QboSyncEntityTypes.ServiceInvoice,
            EntityId = invoiceId,
            PayloadJson = "{}",
            Status = QboSyncRequestStatus.Pending,
            Attempts = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        });
        db.QboConnections.Add(new QboConnection
        {
            Id = QboConnection.SingletonId,
            RealmId = "r1",
            AccessToken = "tok",
            RefreshToken = "ref",
            AccessTokenExpiresAtUtc = DateTime.UtcNow.AddHours(1),
            UpdatedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var processor = scope.ServiceProvider.GetRequiredService<QboSyncRequestProcessor>();
        Assert.True(await processor.ProcessNextAsync(CancellationToken.None));

        var invoice = await db.ServiceInvoices.AsNoTracking().SingleAsync(i => i.Id == invoiceId);
        Assert.Equal("Sent", invoice.Status);
        Assert.False(string.IsNullOrEmpty(invoice.QboDocNumber));

        var sync = await db.QboSyncRequests.SingleAsync(r => r.EntityId == invoiceId);
        Assert.Equal(QboSyncRequestStatus.Sent, sync.Status);
    }
}
