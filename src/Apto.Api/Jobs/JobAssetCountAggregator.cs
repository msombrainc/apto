using Apto.Api.Data;
using Apto.Api.ReferenceData;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Jobs;

public readonly record struct JobAssetCounts(int Wip, int Exception, int Finished, int ProgressPercent);

public static class JobAssetCountAggregator
{
    public static async Task<Dictionary<Guid, JobAssetCounts>> CountsByJobIdAsync(
        AptoDbContext db,
        CancellationToken ct)
    {
        var statusRows = await db.ReferenceItems
            .AsNoTracking()
            .Where(r => r.Type == ReferenceTypes.AssetStatus)
            .Select(r => new { r.Code, r.Group })
            .ToListAsync(ct);

        var groupByCode = statusRows
            .GroupBy(r => r.Code.Trim().ToUpperInvariant(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => NormalizeGroup(g.First().Group));

        var assets = await db.Assets
            .AsNoTracking()
            .Select(a => new { a.JobId, a.Status })
            .ToListAsync(ct);

        var buckets = new Dictionary<Guid, (int Wip, int Ex, int Fin)>();

        foreach (var a in assets)
        {
            if (!buckets.TryGetValue(a.JobId, out var b))
                b = (0, 0, 0);

            var group = ResolveGroup(a.Status, groupByCode);
            if (group == "Finished")
                b.Fin++;
            else if (group == "Exception")
                b.Ex++;
            else
                b.Wip++;

            buckets[a.JobId] = b;
        }

        return buckets.ToDictionary(
            kv => kv.Key,
            kv =>
            {
                var (wip, ex, fin) = kv.Value;
                var total = wip + ex + fin;
                var pct = total == 0 ? 0 : (int)Math.Round(fin * 100.0 / total);
                return new JobAssetCounts(wip, ex, fin, pct);
            });
    }

    private static string NormalizeGroup(string? group)
    {
        var g = (group ?? "WIP").Trim();
        if (g.Equals("Finished", StringComparison.OrdinalIgnoreCase)) return "Finished";
        if (g.Equals("Exception", StringComparison.OrdinalIgnoreCase)) return "Exception";
        return "WIP";
    }

    private static string ResolveGroup(string? statusCode, Dictionary<string, string> groupByCode)
    {
        if (string.IsNullOrWhiteSpace(statusCode))
            return "WIP";
        if (groupByCode.TryGetValue(statusCode.Trim(), out var g))
            return g;
        return "WIP";
    }
}
