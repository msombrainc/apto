using Apto.Api.Assets;

namespace Apto.Api.Tests;

public class AssetValidationTests
{
    [Fact]
    public void Create_rejects_missing_part_number()
    {
        var ok = AssetValidation.TryValidateCreate(
            new AssetWriteRequest(null, "SN-1", null),
            out var error);
        Assert.False(ok);
        Assert.Contains("part number", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Create_rejects_serial_too_long()
    {
        var ok = AssetValidation.TryValidateCreate(
            new AssetWriteRequest(Guid.NewGuid(), new string('x', 101), null),
            out var error);
        Assert.False(ok);
        Assert.Contains("serial", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Update_rejects_empty_change_set()
    {
        var ok = AssetValidation.TryValidateUpdate(
            new AssetWriteRequest(null, null, null),
            out var error);
        Assert.False(ok);
        Assert.Contains("no changes", error, StringComparison.OrdinalIgnoreCase);
    }
}
