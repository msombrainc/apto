using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Apto.Api.QuickBooks;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Accounts;

public static class AccountEndpoints
{
    private const string DemoChangedBy = "demo";

    public static RouteGroupBuilder MapAccountEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/accounts");

        group.MapGet("/", ListAccounts);
        group.MapGet("/{id:guid}", GetAccount);
        group.MapGet("/{id:guid}/changes", ListAccountChanges);
        group.MapPost("/", CreateAccount);
        group.MapPut("/{id:guid}", UpdateAccount);
        group.MapPost("/{id:guid}/qbo-sync", ManualQboSync);

        return group;
    }

    private static async Task<IResult> ListAccounts(
        string? q,
        string? status,
        AptoDbContext db,
        CancellationToken ct)
    {
        var query = db.Accounts.AsNoTracking();
        var statusFilter = string.IsNullOrWhiteSpace(status) ? AccountStatuses.Active : status.Trim();

        if (!string.Equals(statusFilter, "Both", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.Equals(statusFilter, AccountStatuses.Active, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(statusFilter, AccountStatuses.Inactive, StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest(new { error = "status must be Active, Inactive, or Both." });
            }

            query = query.Where(a => a.Status == statusFilter);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(a =>
                a.Name.ToLower().Contains(term) || a.Code.ToLower().Contains(term));
        }

        var accounts = await query.OrderBy(a => a.Name).ToListAsync(ct);
        var items = accounts.Select(a => ToResponse(a, null)).ToList();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetAccount(Guid id, AptoDbContext db, CancellationToken ct)
    {
        var account = await db.Accounts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct);
        if (account is null)
            return Results.NotFound();

        var lastSync = await LoadQboLastSyncAtUtcAsync(db, id, ct);
        return Results.Ok(ToResponse(account, lastSync));
    }

    private static async Task<IResult> ListAccountChanges(
        Guid id,
        string? field,
        DateTime? from,
        DateTime? to,
        int? page,
        int? pageSize,
        AptoDbContext db,
        CancellationToken ct)
    {
        if (!await db.Accounts.AsNoTracking().AnyAsync(a => a.Id == id, ct))
            return Results.NotFound();

        var p = page is null or < 1 ? 1 : page.Value;
        var size = pageSize is null or < 1 ? 25 : Math.Min(pageSize.Value, 100);

        var query = db.AccountChangeLogs.AsNoTracking().Where(l => l.AccountId == id);

        if (!string.IsNullOrWhiteSpace(field))
            query = query.Where(l => l.FieldName == field.Trim());

        if (from is not null)
            query = query.Where(l => l.ChangedAtUtc >= from.Value);

        if (to is not null)
            query = query.Where(l => l.ChangedAtUtc <= to.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(l => l.ChangedAtUtc)
            .Skip((p - 1) * size)
            .Take(size)
            .Select(l => new AccountChangeLogEntry(
                l.FieldName,
                l.OldValue,
                l.NewValue,
                l.ChangedBy,
                l.ChangedAtUtc))
            .ToListAsync(ct);

        return Results.Ok(new AccountChangeLogListResponse(items, p, size, total));
    }

    private static async Task<IResult> CreateAccount(
        AccountWriteRequest request,
        AptoDbContext db,
        IQboSyncEnqueueService enqueue,
        CancellationToken ct)
    {
        if (!AccountValidation.TryValidate(request, out var error))
            return Results.BadRequest(new { error });

        var normalizedCode = request.Code.Trim();
        if (await db.Accounts.AnyAsync(a => a.Code == normalizedCode, ct))
            return Results.Conflict(new { error = "account code already exists." });

        var (slaR, slaP, slaS) = AccountValidation.NormalizeSlaDays(
            request.SlaReceivingDays,
            request.SlaProcessingDays,
            request.SlaShippingDays);
        var settings = AccountValidation.MergeSettings(request.Settings);

        var account = new Account
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Code = normalizedCode,
            Status = AccountValidation.NormalizeStatus(request.Status),
            SlaReceivingDays = slaR,
            SlaProcessingDays = slaP,
            SlaShippingDays = slaS,
            Settings = AccountSettingsJson.Serialize(settings),
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.Accounts.Add(account);
        await db.SaveChangesAsync(ct);

        var enqueued = await enqueue.EnqueueAccountCustomerAsync(account, isCreate: true, ct);
        if (enqueued is null)
            account.QboSyncStatus = QboSyncStatus.Skipped;

        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/accounts/{account.Id}", ToResponse(account, null));
    }

    private static async Task<IResult> UpdateAccount(
        Guid id,
        AccountWriteRequest request,
        AptoDbContext db,
        IQboSyncEnqueueService enqueue,
        CancellationToken ct)
    {
        if (!AccountValidation.TryValidate(request, out var error))
            return Results.BadRequest(new { error });

        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (account is null)
            return Results.NotFound();

        var normalizedCode = request.Code.Trim();
        if (await db.Accounts.AnyAsync(a => a.Id != id && a.Code == normalizedCode, ct))
            return Results.Conflict(new { error = "account code already exists." });

        var beforeSettings = AccountSettingsJson.Parse(account.Settings);
        var afterSettings = AccountValidation.MergeSettings(request.Settings);
        var beforeName = account.Name;
        var beforeBillingSame = AccountSettingsJson.BillingAddressEquals(beforeSettings, afterSettings);

        var newName = request.Name.Trim();
        var newStatus = AccountValidation.NormalizeStatus(request.Status);

        AppendScalarChange(db, account.Id, "Name", account.Name, newName);
        AppendScalarChange(db, account.Id, "Code", account.Code, normalizedCode);
        AppendScalarChange(db, account.Id, "Status", account.Status, newStatus);
        var (slaR, slaP, slaS) = AccountValidation.NormalizeSlaDays(
            request.SlaReceivingDays,
            request.SlaProcessingDays,
            request.SlaShippingDays);

        AppendScalarChange(
            db,
            account.Id,
            "SlaReceivingDays",
            account.SlaReceivingDays.ToString(),
            slaR.ToString());
        AppendScalarChange(
            db,
            account.Id,
            "SlaProcessingDays",
            account.SlaProcessingDays.ToString(),
            slaP.ToString());
        AppendScalarChange(
            db,
            account.Id,
            "SlaShippingDays",
            account.SlaShippingDays.ToString(),
            slaS.ToString());

        foreach (var (field, oldVal, newVal) in AccountSettingsJson.DiffLeaves(beforeSettings, afterSettings))
        {
            db.AccountChangeLogs.Add(new AccountChangeLog
            {
                Id = Guid.NewGuid(),
                AccountId = account.Id,
                FieldName = field,
                OldValue = oldVal,
                NewValue = newVal,
                ChangedBy = DemoChangedBy,
                ChangedAtUtc = DateTime.UtcNow,
            });
        }

        account.Name = newName;
        account.Code = normalizedCode;
        account.Status = newStatus;
        account.SlaReceivingDays = slaR;
        account.SlaProcessingDays = slaP;
        account.SlaShippingDays = slaS;
        account.Settings = AccountSettingsJson.Serialize(afterSettings);

        await db.SaveChangesAsync(ct);

        var nameChanged = !string.Equals(beforeName, newName, StringComparison.Ordinal);
        var billingChanged = !beforeBillingSame;
        if (nameChanged || billingChanged)
            await enqueue.EnqueueAccountCustomerAsync(account, isCreate: false, ct);

        var lastSync = await LoadQboLastSyncAtUtcAsync(db, id, ct);
        return Results.Ok(ToResponse(account, lastSync));
    }

    private static async Task<IResult> ManualQboSync(
        Guid id,
        AptoDbContext db,
        IQboSyncEnqueueService enqueue,
        CancellationToken ct)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (account is null)
            return Results.NotFound();

        var row = await enqueue.EnqueueManualAccountSyncAsync(account, ct);
        if (row is null)
            return Results.Json(new { error = "QuickBooks is not configured." }, statusCode: 503);

        return Results.Accepted($"/api/qbo/requests/{row.Id}", new { requestId = row.Id });
    }

    private static void AppendScalarChange(
        AptoDbContext db,
        Guid accountId,
        string field,
        string? oldValue,
        string? newValue)
    {
        if (string.Equals(oldValue, newValue, StringComparison.Ordinal))
            return;

        db.AccountChangeLogs.Add(new AccountChangeLog
        {
            Id = Guid.NewGuid(),
            AccountId = accountId,
            FieldName = field,
            OldValue = oldValue,
            NewValue = newValue,
            ChangedBy = DemoChangedBy,
            ChangedAtUtc = DateTime.UtcNow,
        });
    }

    private static async Task<DateTime?> LoadQboLastSyncAtUtcAsync(
        AptoDbContext db,
        Guid accountId,
        CancellationToken ct) =>
        await db.QboSyncRequests.AsNoTracking()
            .Where(r =>
                r.EntityId == accountId
                && r.EntityType == QboSyncEntityTypes.Account
                && r.Status == QboSyncRequestStatus.Sent
                && (r.Operation == QboSyncOperations.CreateCustomer
                    || r.Operation == QboSyncOperations.UpdateCustomer))
            .OrderByDescending(r => r.SentAtUtc)
            .Select(r => r.SentAtUtc)
            .FirstOrDefaultAsync(ct);

    private static AccountResponse ToResponse(Account account, DateTime? qboLastSyncAtUtc) =>
        new(
            account.Id,
            account.Name,
            account.Code,
            account.Status,
            account.SlaReceivingDays,
            account.SlaProcessingDays,
            account.SlaShippingDays,
            AccountSettingsJson.Parse(account.Settings),
            account.CreatedAtUtc,
            account.QboCustomerId,
            account.QboSyncStatus,
            account.QboSyncError,
            qboLastSyncAtUtc);
}
