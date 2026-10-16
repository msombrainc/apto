using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.PartNumbers;

public static class PartNumberEndpoints
{
    private const string DemoUser = "demo@aptosolutions.com";

    private static readonly System.Text.Json.JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
    };

    public static RouteGroupBuilder MapPartNumberEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/part-numbers");
        group.MapGet("/", List);
        group.MapPost("/", Create);
        group.MapPut("/{id:guid}", Update);
        group.MapDelete("/{id:guid}", Delete);
        return group;
    }

    private static async Task<IResult> List(
        string? q,
        int? page,
        int? pageSize,
        string? sortBy,
        string? sortDir,
        AptoDbContext db,
        CancellationToken ct)
    {
        var pg = Math.Max(1, page ?? 1);
        var size = Math.Clamp(pageSize ?? 50, 1, 200);
        var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        var sortKey = (sortBy ?? "number").Trim().ToLowerInvariant();

        var query = db.PartNumbers.AsNoTracking().Include(p => p.Category).AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(p => p.Number.ToLower().Contains(term));
        }

        IOrderedQueryable<PartNumber> ordered = sortKey switch
        {
            "categoryname" => desc
                ? query.OrderByDescending(p => p.Category != null ? p.Category.Name : "")
                    .ThenBy(p => p.Number)
                : query.OrderBy(p => p.Category != null ? p.Category.Name : "")
                    .ThenBy(p => p.Number),
            "assetcount" => desc
                ? query.OrderByDescending(p => p.Assets.Count).ThenBy(p => p.Number)
                : query.OrderBy(p => p.Assets.Count).ThenBy(p => p.Number),
            _ => desc
                ? query.OrderByDescending(p => p.Number)
                : query.OrderBy(p => p.Number),
        };

        var total = await ordered.CountAsync(ct);
        var rows = await ordered.Skip((pg - 1) * size).Take(size).ToListAsync(ct);

        var items = new List<PartNumberRowResponse>();
        foreach (var row in rows)
        {
            var assetCount = await db.Assets.AsNoTracking().CountAsync(a => a.PartNumberId == row.Id, ct);
            items.Add(ToRowResponse(row, assetCount));
        }

        var payload = new PartNumberListResponse(items, pg, size, total);

        if (page is null && pageSize is null && sortBy is null && sortDir is null)
        {
            var legacy = items.Select(i => new PartNumberResponse(i.Id, i.Number, i.CategoryName)).ToList();
            return Results.Ok(legacy);
        }

        return Results.Ok(payload);
    }

    private static async Task<IResult> Create(
        HttpRequest httpRequest,
        AptoDbContext db,
        CancellationToken ct)
    {
        using var reader = new StreamReader(httpRequest.Body);
        var raw = await reader.ReadToEndAsync(ct);
        if (string.IsNullOrWhiteSpace(raw))
            return Results.BadRequest(new { error = "invalid body." });

        using var doc = System.Text.Json.JsonDocument.Parse(raw);
        var root = doc.RootElement;
        if (!root.TryGetProperty("categoryName", out _))
        {
            var adminBody = System.Text.Json.JsonSerializer.Deserialize<PartNumberAdminWriteRequest>(raw, JsonOpts);
            if (adminBody is null)
                return Results.BadRequest(new { error = "invalid body." });
            return await CreateAdmin(adminBody, db, ct);
        }

        var request = System.Text.Json.JsonSerializer.Deserialize<PartNumberWriteRequest>(raw, JsonOpts);
        if (request is null)
            return Results.BadRequest(new { error = "invalid body." });
        return await CreateLegacy(request, db, ct);
    }

    private static async Task<IResult> CreateLegacy(
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

    private static async Task<IResult> CreateAdmin(
        PartNumberAdminWriteRequest request,
        AptoDbContext db,
        CancellationToken ct)
    {
        var number = request.Number?.Trim();
        if (string.IsNullOrWhiteSpace(number))
            return Results.BadRequest(new { error = "number is required." });

        if (number.Length > 100)
            return Results.BadRequest(new { error = "number must be at most 100 characters." });

        var existing = await db.PartNumbers.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Number == number, ct);
        if (existing is not null)
            return Results.Conflict(new { error = "part number already exists." });

        if (request.CategoryId is { } catId)
        {
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == catId, ct);
            if (category is null || !category.IsActive)
                return Results.BadRequest(new { error = "category is invalid or inactive." });
        }

        var part = new PartNumber
        {
            Id = Guid.NewGuid(),
            Number = number,
            CategoryId = request.CategoryId,
        };
        db.PartNumbers.Add(part);
        await db.SaveChangesAsync(ct);

        if (part.CategoryId is not null)
            await db.Entry(part).Reference(p => p.Category).LoadAsync(ct);

        return Results.Created($"/api/part-numbers/{part.Id}", ToResponse(part));
    }

    private static async Task<IResult> Update(
        Guid id,
        PartNumberAdminWriteRequest request,
        AptoDbContext db,
        CancellationToken ct)
    {
        var number = request.Number?.Trim();
        if (string.IsNullOrWhiteSpace(number))
            return Results.BadRequest(new { error = "number is required." });

        if (number.Length > 100)
            return Results.BadRequest(new { error = "number must be at most 100 characters." });

        var part = await db.PartNumbers.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (part is null)
            return Results.NotFound();

        var duplicate = await db.PartNumbers.AnyAsync(p => p.Id != id && p.Number == number, ct);
        if (duplicate)
            return Results.Conflict(new { error = "part number already exists." });

        if (request.CategoryId is { } catId)
        {
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == catId, ct);
            if (category is null || !category.IsActive)
                return Results.BadRequest(new { error = "category is invalid or inactive." });
        }

        part.Number = number;
        part.CategoryId = request.CategoryId;

        await db.SaveChangesAsync(ct);
        await db.Entry(part).Reference(p => p.Category).LoadAsync(ct);

        var assetCount = await db.Assets.CountAsync(a => a.PartNumberId == part.Id, ct);
        return Results.Ok(ToRowResponse(part, assetCount));
    }

    private static async Task<IResult> Delete(
        Guid id,
        Guid? replacementId,
        HttpRequest httpRequest,
        AptoDbContext db,
        CancellationToken ct)
    {
        var part = await db.PartNumbers.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (part is null)
            return Results.NotFound();

        var assetCount = await db.Assets.CountAsync(a => a.PartNumberId == id, ct);
        var user = httpRequest.Headers["X-Apto-User"].FirstOrDefault() ?? DemoUser;

        if (assetCount > 0)
        {
            if (replacementId is null)
                return Results.BadRequest(new { error = "replacement part number is required when assets are assigned." });

            if (replacementId == id)
                return Results.BadRequest(new { error = "replacement must be a different part number." });

            var replacement = await db.PartNumbers.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == replacementId, ct);
            if (replacement is null)
                return Results.BadRequest(new { error = "replacement part number not found." });

            var assets = await db.Assets.Where(a => a.PartNumberId == id).ToListAsync(ct);
            var oldNumber = part.Number;
            var newNumber = replacement.Number;

            foreach (var asset in assets)
            {
                asset.PartNumberId = replacementId;
                db.AssetChangeLogs.Add(new AssetChangeLog
                {
                    Id = Guid.NewGuid(),
                    AssetId = asset.Id,
                    FieldName = "partNumber",
                    OldValue = oldNumber,
                    NewValue = newNumber,
                    ChangedBy = user,
                    ChangedAtUtc = DateTime.UtcNow,
                });
            }

            db.PartNumbers.Remove(part);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        }

        db.PartNumbers.Remove(part);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static PartNumberResponse ToResponse(PartNumber part) =>
        new(part.Id, part.Number, part.Category?.Name);

    private static PartNumberRowResponse ToRowResponse(PartNumber part, int assetCount) =>
        new(
            part.Id,
            part.Number,
            part.CategoryId,
            part.Category?.Name,
            assetCount);
}
