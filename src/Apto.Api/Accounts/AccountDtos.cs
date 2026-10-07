namespace Apto.Api.Accounts;

public sealed record AccountWriteRequest(
    string Name,
    string Code,
    int SlaReceivingDays,
    int SlaProcessingDays,
    int SlaShippingDays);

public sealed record AccountResponse(
    Guid Id,
    string Name,
    string Code,
    int SlaReceivingDays,
    int SlaProcessingDays,
    int SlaShippingDays,
    DateTime CreatedAtUtc,
    string? QboCustomerId,
    string QboSyncStatus,
    string? QboSyncError);
