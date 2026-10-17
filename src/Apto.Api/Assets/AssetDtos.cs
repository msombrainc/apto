namespace Apto.Api.Assets;

public record AssetWriteRequest(
    Guid? PartNumberId,
    string? SerialNumber,
    string? NewPartNumber,
    string? Grade = null,
    string? Status = null,
    Guid? LocationId = null);

public record AssetResponse(
    Guid Id,
    string AptoId,
    Guid JobId,
    Guid? PartNumberId,
    string? PartNumber,
    string? Category,
    string? SerialNumber,
    string? Grade,
    string? Status,
    Guid? LocationId,
    string? LocationName,
    DateTime CreatedAtUtc,
    IReadOnlyList<AssetChangeLogEntry> ChangeLog);

public record AssetLookupResponse(
    Guid Id,
    string AptoId,
    string? SerialNumber,
    Guid JobId,
    string? FacilityCode,
    string? Grade,
    string? Status,
    Guid? LocationId,
    string? LocationName,
    string? PartNumber);

public record AssetChangeLogEntry(
    string FieldName,
    string? OldValue,
    string? NewValue,
    string ChangedBy,
    DateTime ChangedAtUtc);

public record AssetInventoryRow(
    Guid Id,
    string AptoId,
    Guid JobId,
    string? SerialNumber,
    string? PartNumber,
    string? CategoryName,
    string? Grade,
    string? Status,
    Guid? LocationId,
    string? LocationName,
    string AccountName,
    string? FacilityCode,
    DateTime CreatedAtUtc);

public record AssetInventoryListResponse(
    IReadOnlyList<AssetInventoryRow> Items,
    int Page,
    int PageSize,
    int Total,
    IReadOnlyList<string>? NotFoundCodes);
