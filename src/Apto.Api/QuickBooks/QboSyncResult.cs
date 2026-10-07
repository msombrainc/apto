namespace Apto.Api.QuickBooks;

public sealed record QboSyncResult(string Status, string? CustomerId, string? Error);
