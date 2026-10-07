namespace Apto.Api.PartNumbers;

public record PartNumberWriteRequest(string Number, string? CategoryName);

public record PartNumberResponse(Guid Id, string Number, string? CategoryName);
