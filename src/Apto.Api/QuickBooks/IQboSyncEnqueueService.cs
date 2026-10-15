using Apto.Api.Data.Entities;

namespace Apto.Api.QuickBooks;

public interface IQboSyncEnqueueService
{
    /// <summary>Enqueue customer sync when QBO integration is configured; otherwise no-op.</summary>
    Task<QboSyncRequest?> EnqueueAccountCustomerAsync(
        Account account,
        bool isCreate,
        CancellationToken ct);

    Task<QboSyncRequest?> EnqueueManualAccountSyncAsync(Account account, CancellationToken ct);
}
