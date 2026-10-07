namespace Apto.Api.Jobs;

public record JobWriteRequest(
    Guid AccountId,
    string? FacilityCode,
    string? OpsStatus,
    DateTime StartDateUtc,
    DateTime? DueDateUtc);

public record JobResponse(
    Guid Id,
    Guid AccountId,
    string AccountName,
    string? FacilityCode,
    string? OpsStatus,
    DateTime? StartDateUtc,
    DateTime? DueDateUtc,
    int SlaTotalDays,
    int DaysRemaining,
    string SlaStatus,
    DateTime CreatedAtUtc);
