namespace Apto.Api.Data.Entities;

public class QboSyncRequest
{
    public Guid Id { get; set; }

    public required string Operation { get; set; }

    public required string EntityType { get; set; }

    public Guid EntityId { get; set; }

    public required string PayloadJson { get; set; }

    public required string Status { get; set; }

    public int Attempts { get; set; }

    public string? LastError { get; set; }

    public string? QboId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public DateTime? SentAtUtc { get; set; }
}
