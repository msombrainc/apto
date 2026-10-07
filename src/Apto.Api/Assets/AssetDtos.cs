namespace Apto.Api.Assets;

public record AssetWriteRequest(Guid? PartNumberId, string? SerialNumber, string? NewPartNumber);

public record AssetResponse(
    Guid Id,
    Guid JobId,
    Guid? PartNumberId,
    string? PartNumber,
    string? SerialNumber,
    DateTime CreatedAtUtc,
    IReadOnlyList<AssetChangeLogEntry> ChangeLog);

public record AssetChangeLogEntry(
    string FieldName,
    string? OldValue,
    string? NewValue,
    string ChangedBy,
    DateTime ChangedAtUtc);
