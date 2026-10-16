namespace Apto.Api.Data.Entities;

/// <summary>Single-row counter for human-readable AptoId allocation (ASSUMPTION-481).</summary>
public class AptoIdSequence
{
    public byte Id { get; set; }

    public int NextNumber { get; set; }
}
