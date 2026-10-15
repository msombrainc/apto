using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.ReferenceData;

public static class CategoryEndpoints
{
    public static RouteGroupBuilder MapCategoryEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/categories");

        group.MapGet("/", ListCategories);
        group.MapPost("/", CreateCategory);
        group.MapPut("/{id:guid}", UpdateCategory);

        return group;
    }

    private static async Task<IResult> ListCategories(
        string? q,
        int? page,
        int? pageSize,
        bool? includeInactive,
        AptoDbContext db,
        CancellationToken ct)
    {
        var pg = Math.Max(1, page ?? 1);
        var size = Math.Clamp(pageSize ?? 50, 1, 200);
        var showInactive = includeInactive == true;

        var query = db.Categories.AsNoTracking();
        if (!showInactive)
            query = query.Where(c => c.IsActive);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(c => c.Name.ToLower().Contains(term));
        }

        query = query.OrderBy(c => c.Name);

        var total = await query.CountAsync(ct);
        var rows = await query.Skip((pg - 1) * size).Take(size).ToListAsync(ct);

        var items = new List<CategoryResponse>();
        foreach (var row in rows)
        {
            var count = await ReferenceInUseCounter.CountCategoryPartNumbersAsync(db, row.Id, ct);
            items.Add(new CategoryResponse(row.Id, row.Name, row.IsActive, count));
        }

        return Results.Ok(new CategoryListResponse(items, pg, size, total));
    }

    private static async Task<IResult> CreateCategory(
        CategoryWriteRequest request,
        AptoDbContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 100)
            return Results.BadRequest(new { error = "name is required (max 100 characters)." });

        var name = request.Name.Trim();
        var exists = await db.Categories.AnyAsync(
            c => c.Name.ToLower() == name.ToLower(),
            ct);
        if (exists)
            return Results.Conflict(new { error = "category name already exists." });

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = name,
            IsActive = true,
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync(ct);

        return Results.Created(
            $"/api/categories/{category.Id}",
            new CategoryResponse(category.Id, category.Name, category.IsActive, 0));
    }

    private static async Task<IResult> UpdateCategory(
        Guid id,
        CategoryWriteRequest request,
        AptoDbContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 100)
            return Results.BadRequest(new { error = "name is required (max 100 characters)." });

        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (category is null)
            return Results.NotFound();

        var name = request.Name.Trim();
        var duplicate = await db.Categories.AnyAsync(
            c => c.Id != id && c.Name.ToLower() == name.ToLower(),
            ct);
        if (duplicate)
            return Results.Conflict(new { error = "category name already exists." });

        category.Name = name;
        if (request.IsActive is { } active)
            category.IsActive = active;

        await db.SaveChangesAsync(ct);

        var count = await ReferenceInUseCounter.CountCategoryPartNumbersAsync(db, category.Id, ct);
        return Results.Ok(new CategoryResponse(category.Id, category.Name, category.IsActive, count));
    }
}
