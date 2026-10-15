using Apto.Api.Data.Entities;

namespace Apto.Api.QuickBooks;

public interface IQboCustomerSyncService
{
    Task<QboSyncResult> SyncAccountCustomerAsync(Account account, CancellationToken ct);

    Task<QboSyncResult> CreateCustomerAsync(QboCustomerPayload payload, CancellationToken ct);

    Task<QboSyncResult> UpdateCustomerAsync(string qboCustomerId, QboCustomerPayload payload, CancellationToken ct);
}
