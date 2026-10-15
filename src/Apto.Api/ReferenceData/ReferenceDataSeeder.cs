using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.ReferenceData;

public static class ReferenceDataSeeder
{
    public static async Task SeedIfEmptyAsync(AptoDbContext db, CancellationToken ct = default)
    {
        if (await db.ReferenceItems.AnyAsync(ct))
            return;

        var now = DateTime.UtcNow;
        var facilities = new (string Code, string Name, int Sort)[]
        {
            ("GA", "Georgia", 0),
            ("TX", "Texas", 1),
            ("CA", "California", 2),
        };

        var facilityIds = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        foreach (var (code, name, sort) in facilities)
        {
            var id = Guid.NewGuid();
            facilityIds[code] = id;
            db.ReferenceItems.Add(new ReferenceItem
            {
                Id = id,
                Type = ReferenceTypes.Facility,
                Code = code,
                Name = name,
                SortOrder = sort,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
        }

        var locationTemplates = new (string Code, string Name, int Sort)[]
        {
            ("RECEIVING", "Receiving", 0),
            ("AUDIT-BENCH", "Audit Bench", 1),
            ("WIPE-ROOM", "Wipe Room", 2),
            ("SHRED-CAGE", "Shred Cage", 3),
            ("RECYCLE-BAY", "Recycle Bay", 4),
            ("SELLABLE", "Sellable Stock", 5),
        };

        foreach (var facilityCode in facilityIds.Keys)
        {
            var parentId = facilityIds[facilityCode];
            foreach (var (code, name, sort) in locationTemplates)
            {
                db.ReferenceItems.Add(new ReferenceItem
                {
                    Id = Guid.NewGuid(),
                    Type = ReferenceTypes.Location,
                    Code = code,
                    Name = name,
                    ParentId = parentId,
                    SortOrder = sort,
                    IsActive = true,
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now,
                });
            }
        }

        var jobStatuses = new (string Code, string Name, int Sort)[]
        {
            ("PICKUP-SCHED", "Pickup Scheduled", 0),
            ("IN-TRANSIT", "In Transit", 1),
            ("RECEIVED", "Received", 2),
            ("WIP", "WIP", 3),
            ("WIP-INPUT-DONE", "WIP Input Complete", 4),
            ("OPS-EXC", "Ops Complete with Exceptions", 5),
            ("OPS-COMPLETE", "Ops Complete", 6),
            ("COMPLETED", "Completed", 7),
            ("CANCELED", "Canceled", 8),
        };

        foreach (var (code, name, sort) in jobStatuses)
        {
            db.ReferenceItems.Add(new ReferenceItem
            {
                Id = Guid.NewGuid(),
                Type = ReferenceTypes.JobStatus,
                Code = code,
                Name = name,
                SortOrder = sort,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
        }

        var assetStatuses = new (string Code, string Name, string Group, string? Cert, int Sort)[]
        {
            ("RECEIVED", "Received", "WIP", null, 0),
            ("IN-AUDIT", "In Audit", "WIP", null, 1),
            ("WIPED", "Wiped", "WIP", "Wiped", 2),
            ("SHREDDED", "Shredded", "Exception", "Shredded", 3),
            ("RECYCLED", "Recycled", "Finished", "Recycled", 4),
            ("READY-SALE", "Ready for Sale", "Finished", null, 5),
            ("EXCEPTION", "Exception", "Exception", null, 6),
        };

        foreach (var (code, name, group, cert, sort) in assetStatuses)
        {
            db.ReferenceItems.Add(new ReferenceItem
            {
                Id = Guid.NewGuid(),
                Type = ReferenceTypes.AssetStatus,
                Code = code,
                Name = name,
                Group = group,
                CertificateGroup = cert,
                SortOrder = sort,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
        }

        var grades = new (string Code, string Name, int Sort)[]
        {
            ("U", "Ungraded", 0),
            ("A", "Grade A", 1),
            ("B", "Grade B", 2),
            ("C", "Grade C", 3),
            ("D", "Grade D", 4),
        };

        foreach (var (code, name, sort) in grades)
        {
            db.ReferenceItems.Add(new ReferenceItem
            {
                Id = Guid.NewGuid(),
                Type = ReferenceTypes.Grade,
                Code = code,
                Name = name,
                SortOrder = sort,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
        }

        db.ReferenceItems.Add(new ReferenceItem
        {
            Id = Guid.NewGuid(),
            Type = ReferenceTypes.Damage,
            Code = "SCRATCH",
            Name = "Scratch / cosmetic",
            SortOrder = 0,
            IsActive = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        });

        await db.SaveChangesAsync(ct);
    }
}
