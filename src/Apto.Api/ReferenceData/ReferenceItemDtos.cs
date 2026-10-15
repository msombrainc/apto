namespace Apto.Api.ReferenceData;

public sealed record ReferenceItemResponse(
    Guid Id,
    string Type,
    string Code,
    string Name,
    Guid? ParentId,
    string? ParentCode,
    string? ParentName,
    string? Group,
    string? CertificateGroup,
    int SortOrder,
    bool IsActive,
    int InUseCount);

public sealed record ReferenceListResponse(
    IReadOnlyList<ReferenceItemResponse> Items,
    int Page,
    int PageSize,
    int Total);

public sealed record ReferenceWriteRequest(
    string Code,
    string Name,
    int SortOrder,
    Guid? ParentId,
    string? Group,
    string? CertificateGroup,
    bool? IsActive);

public sealed record CategoryResponse(
    Guid Id,
    string Name,
    bool IsActive,
    int PartNumberCount);

public sealed record CategoryListResponse(
    IReadOnlyList<CategoryResponse> Items,
    int Page,
    int PageSize,
    int Total);

public sealed record CategoryWriteRequest(string Name, bool? IsActive);
