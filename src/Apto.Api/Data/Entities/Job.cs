namespace Apto.Api.Data.Entities;

public class Job
{
    public Guid Id { get; set; }

    public Guid AccountId { get; set; }

    public Account Account { get; set; } = null!;

    public string? FacilityCode { get; set; }

    public string? OpsStatus { get; set; }

    public DateTime? StartDateUtc { get; set; }

    public DateTime? DueDateUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
