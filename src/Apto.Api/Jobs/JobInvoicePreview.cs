using System.Text.Json;
using Apto.Api.Accounts;
using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Jobs;

internal static class JobInvoicePreview
{
    private static readonly (string Key, string Label, string HintTemplate)[] CoreLines =
    [
        ("audit", "Audit", "{0} assets on job"),
        ("wipe", "Wipe", "{0} assets with status Wiped"),
        ("shred", "Shred", "{0} assets with status Shredded"),
        ("recycle", "Recycle", "{0} assets with status Recycled"),
    ];

    internal static async Task<object?> BuildAsync(AptoDbContext db, Guid jobId, CancellationToken ct)
    {
        var job = await db.Jobs.AsNoTracking().Include(j => j.Account)
            .FirstOrDefaultAsync(j => j.Id == jobId, ct);
        if (job is null)
            return null;

        var settings = AccountSettingsJson.Parse(job.Account.Settings);
        var fees = settings.Fees;

        var assets = await db.Assets.AsNoTracking().Where(a => a.JobId == jobId).ToListAsync(ct);
        var statusRows = await db.ReferenceItems.AsNoTracking()
            .Where(r => r.Type == "asset-status" && r.IsActive)
            .ToListAsync(ct);

        var counts = CountAssets(assets, statusRows);
        var lines = new List<object>();

        foreach (var def in CoreLines)
        {
            var rate = FeeRate(fees, def.Key);
            if (rate is null)
                continue;

            var qty = DefaultQty(def.Key, counts);
            var hint = string.Format(def.HintTemplate, qty);
            lines.Add(new
            {
                serviceKey = def.Key,
                label = def.Label,
                unitRate = rate.Value,
                defaultQuantity = qty,
                quantityHint = hint,
                lineTotal = Math.Round(rate.Value * qty, 2, MidpointRounding.AwayFromZero),
            });
        }

        return new
        {
            jobId = job.Id,
            accountId = job.AccountId,
            accountName = job.Account.Name,
            qboCustomerId = job.Account.QboCustomerId,
            lines,
        };
    }

    private static decimal? FeeRate(AccountFeesDto fees, string key) => key switch
    {
        "audit" => fees.Audit,
        "wipe" => fees.Wipe,
        "shred" => fees.Shred,
        "recycle" => fees.Recycle,
        _ => null,
    };

    private static int DefaultQty(string key, (int Total, int Wiped, int Shredded, int Recycled) counts) =>
        key switch
        {
            "audit" => counts.Total,
            "wipe" => counts.Wiped,
            "shred" => counts.Shredded,
            "recycle" => counts.Recycled,
            _ => 0,
        };

    private static (int Total, int Wiped, int Shredded, int Recycled) CountAssets(
        List<Asset> assets,
        List<ReferenceItem> statusRows)
    {
        var wipedCodes = CodesForGroup(statusRows, "Wiped");
        var shreddedCodes = CodesForGroup(statusRows, "Shredded");
        var recycledCodes = CodesForGroup(statusRows, "Recycled");

        int wiped = 0, shredded = 0, recycled = 0;
        foreach (var a in assets)
        {
            var s = (a.Status ?? "").Trim();
            if (s.Length == 0)
                continue;
            var lower = s.ToLowerInvariant();
            if (wipedCodes.Contains(lower))
                wiped++;
            else if (shreddedCodes.Contains(lower))
                shredded++;
            else if (recycledCodes.Contains(lower))
                recycled++;
        }

        return (assets.Count, wiped, shredded, recycled);
    }

    private static HashSet<string> CodesForGroup(List<ReferenceItem> rows, string group)
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in rows)
        {
            if (string.Equals(r.CertificateGroup, group, StringComparison.OrdinalIgnoreCase)
                || string.Equals(r.Code, group, StringComparison.OrdinalIgnoreCase)
                || string.Equals(r.Name, group, StringComparison.OrdinalIgnoreCase))
            {
                set.Add(r.Code);
                set.Add(r.Name);
            }
        }

        set.Add(group);
        return set;
    }

    internal static string SerializeLines(IEnumerable<InvoiceLineWrite> lines) =>
        JsonSerializer.Serialize(lines, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

    internal sealed record InvoiceLineWrite(string ServiceKey, int Quantity, decimal UnitRate, decimal Amount);
}
