namespace Apto.Api.Data.Entities;

public class PartNumber
{
    public Guid Id { get; set; }

    public required string Number { get; set; }

    public Guid? CategoryId { get; set; }

    public Category? Category { get; set; }

    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
