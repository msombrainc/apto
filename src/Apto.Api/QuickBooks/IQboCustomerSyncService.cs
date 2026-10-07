using Apto.Api.Data.Entities;

namespace Apto.Api.QuickBooks;

public interface IQboCustomerSyncService
{
    Task<QboSyncResult> SyncAccountCustomerAsync(Account account, CancellationToken ct);
}
