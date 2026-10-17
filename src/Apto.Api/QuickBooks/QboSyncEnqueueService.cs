using System.Text.Json;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.Extensions.Options;

namespace Apto.Api.QuickBooks;

public sealed class QboSyncEnqueueService(
    AptoDbContext db,
    IOptions<QboOptions> options) : IQboSyncEnqueueService
{
    private readonly QboOptions _options = options.Value;

    public async Task<QboSyncRequest?> EnqueueAccountCustomerAsync(
        Account account,
        bool isCreate,
        CancellationToken ct)
    {
        if (!_options.IsConfigured)
            return null;

        var operation = isCreate || string.IsNullOrEmpty(account.QboCustomerId)
            ? QboSyncOperations.CreateCustomer
            : QboSyncOperations.UpdateCustomer;

        return await EnqueueAsync(operation, QboSyncEntityTypes.Account, account.Id, account, ct);
    }

    public async Task<QboSyncRequest?> EnqueueManualAccountSyncAsync(Account account, CancellationToken ct)
    {
        if (!_options.IsConfigured)
            return null;

        var operation = string.IsNullOrEmpty(account.QboCustomerId)
            ? QboSyncOperations.CreateCustomer
            : QboSyncOperations.UpdateCustomer;

        return await EnqueueAsync(operation, QboSyncEntityTypes.Account, account.Id, account, ct);
    }

    public async Task<QboSyncRequest?> EnqueueServiceInvoiceAsync(
        ServiceInvoice invoice,
        Account account,
        CancellationToken ct)
    {
        if (!_options.IsConfigured)
            return null;

        var payload = JsonSerializer.Serialize(new
        {
            serviceInvoiceId = invoice.Id,
            jobId = invoice.JobId,
            accountId = account.Id,
            qboCustomerId = account.QboCustomerId,
            linesJson = invoice.LinesJson,
            total = invoice.Total,
            note = invoice.Note,
        });

        var now = DateTime.UtcNow;
        var row = new QboSyncRequest
        {
            Id = Guid.NewGuid(),
            Operation = QboSyncOperations.CreateInvoice,
            EntityType = QboSyncEntityTypes.ServiceInvoice,
            EntityId = invoice.Id,
            PayloadJson = payload,
            Status = QboSyncRequestStatus.Pending,
            Attempts = 0,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        db.QboSyncRequests.Add(row);
        await db.SaveChangesAsync(ct);
        return row;
    }

    private async Task<QboSyncRequest> EnqueueAsync(
        string operation,
        string entityType,
        Guid entityId,
        Account account,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var row = new QboSyncRequest
        {
            Id = Guid.NewGuid(),
            Operation = operation,
            EntityType = entityType,
            EntityId = entityId,
            PayloadJson = QboCustomerPayload.FromAccount(account).ToJson(),
            Status = QboSyncRequestStatus.Pending,
            Attempts = 0,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        db.QboSyncRequests.Add(row);
        account.QboSyncStatus = QboSyncStatus.Pending;
        account.QboSyncError = null;
        await db.SaveChangesAsync(ct);
        return row;
    }
}
