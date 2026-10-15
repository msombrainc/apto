using Apto.Api.Data;
using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.QuickBooks;

public static class QboSyncEndpoints
{
    public static RouteGroupBuilder MapQboSyncEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/qbo");

        group.MapGet("/status", GetStatus);
        group.MapGet("/requests", ListRequests);
        group.MapPost("/requests/{id:guid}/retry", RetryRequest);

        return group;
    }

    private static async Task<IResult> GetStatus(
        AptoDbContext db,
        QboOAuthService oauth,
        HttpContext http,
        CancellationToken ct)
    {
        var connection = await db.QboConnections.AsNoTracking()
            .SingleOrDefaultAsync(ct);

        var connected = connection is not null
            && !string.IsNullOrEmpty(connection.RealmId)
            && connection.AccessTokenExpiresAtUtc is { } exp
            && exp > DateTime.UtcNow
            && !string.IsNullOrEmpty(connection.AccessToken);

        if (connected)
        {
            return Results.Ok(new
            {
                connected = true,
                companyName = $"Realm {connection!.RealmId}",
                realmId = connection.RealmId,
            });
        }

        var response = new Dictionary<string, object?>
        {
            ["connected"] = false,
            ["companyName"] = null,
            ["realmId"] = connection?.RealmId,
        };

        if (oauth.IsConfigured)
        {
            var state = Guid.NewGuid().ToString("N");
            http.Response.Cookies.Append(
                "qbo_oauth_state",
                state,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = false,
                    SameSite = SameSiteMode.Lax,
                    MaxAge = TimeSpan.FromMinutes(10),
                });
            response["connectUrl"] = oauth.BuildAuthorizeUrl(state);
        }

        return Results.Ok(response);
    }

    private static async Task<IResult> ListRequests(
        string? status,
        string? type,
        int? page,
        int? pageSize,
        AptoDbContext db,
        CancellationToken ct)
    {
        var pg = Math.Max(1, page ?? 1);
        var size = Math.Clamp(pageSize ?? 50, 1, 200);

        var query = db.QboSyncRequests.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && IsKnownStatus(status))
            query = query.Where(r => r.Status == status);

        if (!string.IsNullOrWhiteSpace(type) && QboSyncOperations.IsKnown(type))
            query = query.Where(r => r.Operation == type);

        query = query.OrderByDescending(r => r.CreatedAtUtc);

        var total = await query.CountAsync(ct);
        var rows = await query.Skip((pg - 1) * size).Take(size).ToListAsync(ct);

        var accountIds = rows
            .Where(r => r.EntityType == QboSyncEntityTypes.Account)
            .Select(r => r.EntityId)
            .Distinct()
            .ToList();

        var accountLabels = await db.Accounts.AsNoTracking()
            .Where(a => accountIds.Contains(a.Id))
            .Select(a => new { a.Id, a.Name })
            .ToDictionaryAsync(a => a.Id, a => a.Name, ct);

        var items = rows.Select(r => new QboSyncRequestListItem(
            r.Id,
            r.Operation,
            r.EntityType,
            r.EntityId,
            ResolveEntityLabel(r, accountLabels),
            r.Status,
            r.Attempts,
            r.LastError,
            r.QboId,
            r.CreatedAtUtc,
            r.SentAtUtc)).ToList();

        return Results.Ok(new QboSyncRequestListResponse(items, pg, size, total));
    }

    private static async Task<IResult> RetryRequest(Guid id, AptoDbContext db, CancellationToken ct)
    {
        var row = await db.QboSyncRequests.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (row is null)
            return Results.NotFound();

        if (row.Status != QboSyncRequestStatus.Failed)
            return Results.BadRequest(new { error = "Only failed requests can be retried." });

        row.Status = QboSyncRequestStatus.Pending;
        row.Attempts = 0;
        row.LastError = null;
        row.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static bool IsKnownStatus(string status) =>
        status is QboSyncRequestStatus.Pending
            or QboSyncRequestStatus.Processing
            or QboSyncRequestStatus.Sent
            or QboSyncRequestStatus.Failed;

    private static string ResolveEntityLabel(
        QboSyncRequest row,
        IReadOnlyDictionary<Guid, string> accountLabels)
    {
        if (row.EntityType == QboSyncEntityTypes.Account
            && accountLabels.TryGetValue(row.EntityId, out var name))
            return name;

        return row.EntityId.ToString();
    }
}

public sealed record QboSyncRequestListItem(
    Guid Id,
    string Operation,
    string EntityType,
    Guid EntityId,
    string EntityLabel,
    string Status,
    int Attempts,
    string? LastError,
    string? QboId,
    DateTime CreatedAtUtc,
    DateTime? SentAtUtc);

public sealed record QboSyncRequestListResponse(
    IReadOnlyList<QboSyncRequestListItem> Items,
    int Page,
    int PageSize,
    int Total);
