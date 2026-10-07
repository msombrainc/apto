namespace Apto.Api.Data.Entities;

public class AssetChangeLog
{
    public Guid Id { get; set; }

    public Guid AssetId { get; set; }

    public Asset Asset { get; set; } = null!;

    public required string FieldName { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public required string ChangedBy { get; set; }

    public DateTime ChangedAtUtc { get; set; }
}
