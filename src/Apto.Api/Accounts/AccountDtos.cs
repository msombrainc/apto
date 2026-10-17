namespace Apto.Api.Accounts;

public sealed record AccountWriteRequest(
    string Name,
    string Code,
    int SlaReceivingDays,
    int SlaProcessingDays,
    int SlaShippingDays,
    string? Status = null,
    AccountSettingsDto? Settings = null);

public sealed record AccountResponse(
    Guid Id,
    string Name,
    string Code,
    string Status,
    int SlaReceivingDays,
    int SlaProcessingDays,
    int SlaShippingDays,
    AccountSettingsDto Settings,
    DateTime CreatedAtUtc,
    string? QboCustomerId,
    string QboSyncStatus,
    string? QboSyncError,
    DateTime? QboLastSyncAtUtc);

public sealed record AccountChangeLogEntry(
    string FieldName,
    string? OldValue,
    string? NewValue,
    string ChangedBy,
    DateTime ChangedAtUtc);

public sealed record AccountChangeLogListResponse(
    IReadOnlyList<AccountChangeLogEntry> Items,
    int Page,
    int PageSize,
    int Total);
