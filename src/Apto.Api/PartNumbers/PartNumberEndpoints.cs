using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.PartNumbers;

public static class PartNumberEndpoints
{
    public static RouteGroupBuilder MapPartNumberEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/part-numbers");
        group.MapGet("/", Search);
        group.MapPost("/", Create);
        return group;
    }

    private static async Task<IResult> Search(string? q, AptoDbContext db, CancellationToken ct)
    {
        var query = db.PartNumbers.AsNoTracking().Include(p => p.Category).AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(p => p.Number.ToLower().Contains(term));
        }

        var items = await query.OrderBy(p => p.Number).Take(50).ToListAsync(ct);
        return Results.Ok(items.Select(ToResponse).ToList());
    }

    private static async Task<IResult> Create(
        PartNumberWriteRequest request,
        AptoDbContext db,
        CancellationToken ct)
    {
        var number = request.Number?.Trim();
        if (string.IsNullOrWhiteSpace(number))
            return Results.BadRequest(new { error = "number is required." });

        if (number.Length > 100)
            return Results.BadRequest(new { error = "number must be at most 100 characters." });

        var existing = await db.PartNumbers.AsNoTracking()
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Number == number, ct);
        if (existing is not null)
            return Results.Ok(ToResponse(existing));

        Guid? categoryId = null;
        if (!string.IsNullOrWhiteSpace(request.CategoryName))
        {
            var catName = request.CategoryName.Trim();
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Name == catName, ct);
            if (category is null)
            {
                category = new Category { Id = Guid.NewGuid(), Name = catName };
                db.Categories.Add(category);
            }

            categoryId = category.Id;
        }

        var part = new PartNumber
        {
            Id = Guid.NewGuid(),
            Number = number,
            CategoryId = categoryId,
        };
        db.PartNumbers.Add(part);
        await db.SaveChangesAsync(ct);

        if (categoryId is not null)
            await db.Entry(part).Reference(p => p.Category).LoadAsync(ct);

        return Results.Created($"/api/part-numbers/{part.Id}", ToResponse(part));
    }

    private static PartNumberResponse ToResponse(PartNumber part) =>
        new(part.Id, part.Number, part.Category?.Name);
}
