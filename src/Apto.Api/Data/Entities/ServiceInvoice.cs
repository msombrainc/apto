namespace Apto.Api.Data.Entities;

public class ServiceInvoice
{
    public Guid Id { get; set; }

    public Guid JobId { get; set; }

    public Job Job { get; set; } = null!;

    public Guid AccountId { get; set; }

    public Account Account { get; set; } = null!;

    /// <summary>JSON array of { serviceKey, quantity, unitRate, amount }.</summary>
    public string LinesJson { get; set; } = "[]";

    public decimal Total { get; set; }

    public string? Note { get; set; }

    /// <summary>Draft, Queued, Sent, Failed</summary>
    public string Status { get; set; } = "Draft";

    public string? QboInvoiceId { get; set; }

    public string? QboDocNumber { get; set; }

    public string? LastError { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}
