namespace Apto.Api.Assets;

public static class AssetValidation
{
    public static bool TryValidateCreate(AssetWriteRequest request, out string? error)
    {
        if (request.PartNumberId is null && string.IsNullOrWhiteSpace(request.NewPartNumber))
        {
            error = "part number is required (select existing or enter a new number).";
            return false;
        }

        if (!string.IsNullOrWhiteSpace(request.NewPartNumber) && request.NewPartNumber.Trim().Length > 100)
        {
            error = "part number must be at most 100 characters.";
            return false;
        }

        if (request.SerialNumber is { Length: > 100 })
        {
            error = "serial number must be at most 100 characters.";
            return false;
        }

        error = null;
        return true;
    }

    public static bool TryValidateUpdate(AssetWriteRequest request, out string? error)
    {
        if (request.PartNumberId is null
            && string.IsNullOrWhiteSpace(request.NewPartNumber)
            && request.SerialNumber is null)
        {
            error = "no changes supplied.";
            return false;
        }

        if (!string.IsNullOrWhiteSpace(request.NewPartNumber) && request.NewPartNumber.Trim().Length > 100)
        {
            error = "part number must be at most 100 characters.";
            return false;
        }

        if (request.SerialNumber is { Length: > 100 })
        {
            error = "serial number must be at most 100 characters.";
            return false;
        }

        error = null;
        return true;
    }
}
