using System.Text.Json;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Apto.Api.QuickBooks;

public sealed class QboSyncRequestProcessor(
    AptoDbContext db,
    IQboCustomerSyncService customerSync,
    IOptions<QboOptions> options)
{
    private const int MaxAttempts = 5;
    private readonly QboOptions _options = options.Value;

    public static TimeSpan BackoffAfterAttempt(int attempts) =>
        TimeSpan.FromSeconds(30 * Math.Pow(2, Math.Max(0, attempts - 1)));

    public async Task<bool> ProcessNextAsync(CancellationToken ct)
    {
        if (await db.QboSyncRequests.AnyAsync(r => r.Status == QboSyncRequestStatus.Processing, ct))
            return false;

        var now = DateTime.UtcNow;
        var candidate = await db.QboSyncRequests
            .Where(r => r.Status == QboSyncRequestStatus.Pending)
            .OrderBy(r => r.CreatedAtUtc)
            .ToListAsync(ct);

        QboSyncRequest? next = null;
        foreach (var row in candidate)
        {
            if (row.Attempts == 0)
            {
                next = row;
                break;
            }

            var wait = BackoffAfterAttempt(row.Attempts);
            if (row.UpdatedAtUtc + wait <= now)
            {
                next = row;
                break;
            }
        }

        if (next is null)
            return false;

        next.Status = QboSyncRequestStatus.Processing;
        next.Attempts += 1;
        next.UpdatedAtUtc = now;
        await db.SaveChangesAsync(ct);

        await DispatchAsync(next, ct);
        return true;
    }

    private async Task DispatchAsync(QboSyncRequest row, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        try
        {
            if (!_options.IsConfigured)
            {
                await DeferPendingWithoutAttemptAsync(row, "QuickBooks integration is not configured.", now, ct);
                return;
            }

            QboConnection? connection;
            try
            {
                connection = await db.QboConnections.SingleOrDefaultAsync(ct);
            }
            catch
            {
                connection = null;
            }

            var hasConnection = connection is not null
                && !string.IsNullOrEmpty(connection.RealmId)
                && (!string.IsNullOrEmpty(connection.AccessToken) || !string.IsNullOrEmpty(connection.RefreshToken));

            if (!hasConnection)
            {
                await DeferPendingWithoutAttemptAsync(row, "QuickBooks not connected", now, ct);
                return;
            }

            switch (row.Operation)
            {
                case QboSyncOperations.CreateCustomer:
                    await ProcessCreateCustomerAsync(row, now, ct);
                    break;
                case QboSyncOperations.UpdateCustomer:
                    await ProcessUpdateCustomerAsync(row, now, ct);
                    break;
                case QboSyncOperations.CreateInvoice:
                    await ProcessCreateInvoiceAsync(row, now, ct);
                    break;
                default:
                    await FailAttemptAsync(row, $"Unknown operation {row.Operation}", now, ct);
                    break;
            }
        }
        catch (Exception ex)
        {
            await FailAttemptAsync(row, ex.Message, now, ct);
        }
    }

    private async Task ProcessCreateCustomerAsync(QboSyncRequest row, DateTime now, CancellationToken ct)
    {
        var payload = JsonSerializer.Deserialize<QboCustomerPayload>(row.PayloadJson)
            ?? new QboCustomerPayload("", "");

        var result = await customerSync.CreateCustomerAsync(payload, ct);
        await CompleteCustomerResultAsync(row, result, now, ct);
    }

    private async Task ProcessUpdateCustomerAsync(QboSyncRequest row, DateTime now, CancellationToken ct)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == row.EntityId, ct);
        var qboId = account?.QboCustomerId;
        if (string.IsNullOrEmpty(qboId))
        {
            var payload = JsonSerializer.Deserialize<QboCustomerPayload>(row.PayloadJson)
                ?? new QboCustomerPayload("", "");
            var create = await customerSync.CreateCustomerAsync(payload, ct);
            await CompleteCustomerResultAsync(row, create, now, ct);
            return;
        }

        var updatePayload = JsonSerializer.Deserialize<QboCustomerPayload>(row.PayloadJson)
            ?? new QboCustomerPayload("", "");
        var result = await customerSync.UpdateCustomerAsync(qboId, updatePayload, ct);
        await CompleteCustomerResultAsync(row, result, now, ct);
    }

    private async Task ProcessCreateInvoiceAsync(QboSyncRequest row, DateTime now, CancellationToken ct)
    {
        if (row.EntityType != QboSyncEntityTypes.Account)
        {
            await FailAttemptAsync(row, "CreateInvoice requires an Account entity.", now, ct);
            return;
        }

        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == row.EntityId, ct);
        if (account is null || string.IsNullOrEmpty(account.QboCustomerId))
        {
            row.LastError = "Cannot create invoice: account customer is not synced to QuickBooks.";
            row.Status = QboSyncRequestStatus.Failed;
            row.UpdatedAtUtc = now;
            await db.SaveChangesAsync(ct);
            return;
        }

        await FailAttemptAsync(row, "CreateInvoice is not implemented in this release.", now, ct);
    }

    private async Task CompleteCustomerResultAsync(
        QboSyncRequest row,
        QboSyncResult result,
        DateTime now,
        CancellationToken ct)
    {
        if (result.Status == QboSyncStatus.Synced && !string.IsNullOrEmpty(result.CustomerId))
        {
            row.Status = QboSyncRequestStatus.Sent;
            row.QboId = result.CustomerId;
            row.SentAtUtc = now;
            row.LastError = null;
            row.UpdatedAtUtc = now;
            await ApplyAccountMirrorAsync(row, success: true, result.CustomerId, null, ct);
            await db.SaveChangesAsync(ct);
            return;
        }

        await FailAttemptAsync(row, result.Error ?? "QBO sync failed.", now, ct);
    }

    /// <summary>
    /// FR-1213: no QBO connection — do not call QBO or consume retry budget; row stays Pending.
    /// </summary>
    private async Task DeferPendingWithoutAttemptAsync(
        QboSyncRequest row,
        string error,
        DateTime now,
        CancellationToken ct)
    {
        if (row.Attempts > 0)
            row.Attempts -= 1;

        row.Status = QboSyncRequestStatus.Pending;
        row.LastError = error.Length > 2000 ? error[..2000] : error;
        row.UpdatedAtUtc = now;
        await db.SaveChangesAsync(ct);
    }

    private async Task FailAttemptAsync(QboSyncRequest row, string error, DateTime now, CancellationToken ct)
    {
        row.LastError = error.Length > 2000 ? error[..2000] : error;
        row.UpdatedAtUtc = now;

        if (row.Attempts >= MaxAttempts)
        {
            row.Status = QboSyncRequestStatus.Failed;
            await ApplyAccountMirrorAsync(row, success: false, null, row.LastError, ct);
        }
        else
        {
            row.Status = QboSyncRequestStatus.Pending;
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task ApplyAccountMirrorAsync(
        QboSyncRequest row,
        bool success,
        string? qboCustomerId,
        string? error,
        CancellationToken ct)
    {
        if (row.EntityType != QboSyncEntityTypes.Account)
            return;

        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == row.EntityId, ct);
        if (account is null)
            return;

        if (success)
        {
            account.QboCustomerId = qboCustomerId;
            account.QboSyncStatus = QboSyncStatus.Synced;
            account.QboSyncError = null;
        }
        else if (row.Status == QboSyncRequestStatus.Failed)
        {
            account.QboSyncStatus = QboSyncStatus.Failed;
            account.QboSyncError = error;
        }
    }
}
