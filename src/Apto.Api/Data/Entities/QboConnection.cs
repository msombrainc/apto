namespace Apto.Api.Data.Entities;

/// <summary>Single-row OAuth state for the sandbox company (PoC).</summary>
public class QboConnection
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    public string? RealmId { get; set; }

    public string? AccessToken { get; set; }

    public string? RefreshToken { get; set; }

    public DateTime? AccessTokenExpiresAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}
