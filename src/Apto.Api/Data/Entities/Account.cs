namespace Apto.Api.Data.Entities;

public class Account
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public required string Code { get; set; }

    public int SlaReceivingDays { get; set; }

    public int SlaProcessingDays { get; set; }

    public int SlaShippingDays { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public ICollection<Job> Jobs { get; set; } = new List<Job>();
}
