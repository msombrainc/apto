namespace Apto.Api.Data.Entities;

public class ReferenceItem
{
    public Guid Id { get; set; }

    public required string Type { get; set; }

    public required string Code { get; set; }

    public required string Name { get; set; }

    public Guid? ParentId { get; set; }

    public ReferenceItem? Parent { get; set; }

    public string? Group { get; set; }

    public string? CertificateGroup { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public ICollection<ReferenceItem> Children { get; set; } = new List<ReferenceItem>();
}
