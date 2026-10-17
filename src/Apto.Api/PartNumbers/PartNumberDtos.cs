namespace Apto.Api.PartNumbers;

public record PartNumberWriteRequest(string Number, string? CategoryName);

public record PartNumberAdminWriteRequest(string Number, Guid? CategoryId);

public record PartNumberResponse(Guid Id, string Number, string? CategoryName);

public record PartNumberRowResponse(
    Guid Id,
    string Number,
    Guid? CategoryId,
    string? CategoryName,
    int AssetCount);

public record PartNumberListResponse(
    IReadOnlyList<PartNumberRowResponse> Items,
    int Page,
    int PageSize,
    int Total);
