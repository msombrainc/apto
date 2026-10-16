namespace Apto.Api.Data.Entities;

public class Asset
{
    public Guid Id { get; set; }

    public string AptoId { get; set; } = "";

    public Guid JobId { get; set; }

    public Job Job { get; set; } = null!;

    public string? SerialNumber { get; set; }

    public Guid? PartNumberId { get; set; }

    public PartNumber? PartNumber { get; set; }

    public string? Grade { get; set; }

    public string? Status { get; set; }

    public Guid? LocationId { get; set; }

    public ReferenceItem? Location { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
