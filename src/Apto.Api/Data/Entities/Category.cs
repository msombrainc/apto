namespace Apto.Api.Data.Entities;

public class Category
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<PartNumber> PartNumbers { get; set; } = new List<PartNumber>();
}
