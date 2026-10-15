namespace Apto.Api.ReferenceData;

public static class ReferenceTypes
{
    public const string Facility = "facility";
    public const string Location = "location";
    public const string JobStatus = "job-status";
    public const string AssetStatus = "asset-status";
    public const string Grade = "grade";
    public const string Damage = "damage";

    public static readonly string[] All =
    [
        Facility,
        Location,
        JobStatus,
        AssetStatus,
        Grade,
        Damage,
    ];

    public static bool IsKnown(string? type) =>
        !string.IsNullOrWhiteSpace(type)
        && All.Contains(type.Trim().ToLowerInvariant(), StringComparer.Ordinal);
}
