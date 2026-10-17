namespace Apto.Api.Data.Entities;

public class AccountChangeLog
{
    public Guid Id { get; set; }

    public Guid AccountId { get; set; }

    public Account Account { get; set; } = null!;

    public required string FieldName { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public required string ChangedBy { get; set; }

    public DateTime ChangedAtUtc { get; set; }
}
