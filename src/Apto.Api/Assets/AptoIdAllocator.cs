using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Assets;

public static class AptoIdAllocator
{
    private const byte SequenceRowId = 1;

    public static async Task<string> AllocateNextAsync(AptoDbContext db, CancellationToken ct)
    {
        var row = await db.AptoIdSequences.FirstOrDefaultAsync(s => s.Id == SequenceRowId, ct);
        if (row is null)
        {
            row = new AptoIdSequence { Id = SequenceRowId, NextNumber = 1 };
            db.AptoIdSequences.Add(row);
        }

        var number = row.NextNumber;
        row.NextNumber = number + 1;
        await db.SaveChangesAsync(ct);
        return Format(number);
    }

    public static string Format(int number) => $"A{number:D7}";
}
