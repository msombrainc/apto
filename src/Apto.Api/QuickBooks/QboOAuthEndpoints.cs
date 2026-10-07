namespace Apto.Api.QuickBooks;

public static class QboOAuthEndpoints
{
    public static RouteGroupBuilder MapQboOAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/qbo/oauth");

        group.MapGet("/authorize", GetAuthorizeUrl);
        group.MapGet("/callback", OAuthCallback);

        return group;
    }

    private static IResult GetAuthorizeUrl(QboOAuthService oauth, HttpContext http)
    {
        if (!oauth.IsConfigured)
            return Results.Json(new { error = "QuickBooks OAuth is not configured." }, statusCode: 503);

        var state = Guid.NewGuid().ToString("N");
        http.Response.Cookies.Append(
            "qbo_oauth_state",
            state,
            new CookieOptions { HttpOnly = true, Secure = false, SameSite = SameSiteMode.Lax, MaxAge = TimeSpan.FromMinutes(10) });

        return Results.Ok(new { authorizeUrl = oauth.BuildAuthorizeUrl(state) });
    }

    private static async Task<IResult> OAuthCallback(
        string? code,
        string? state,
        string? realmId,
        QboOAuthService oauth,
        HttpContext http,
        CancellationToken ct)
    {
        if (!oauth.IsConfigured)
            return Results.Json(new { error = "QuickBooks OAuth is not configured." }, statusCode: 503);

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(realmId))
            return Results.BadRequest(new { error = "Missing code or realmId from Intuit callback." });

        if (!http.Request.Cookies.TryGetValue("qbo_oauth_state", out var expected)
            || string.IsNullOrEmpty(state)
            || !string.Equals(expected, state, StringComparison.Ordinal))
            return Results.BadRequest(new { error = "Invalid OAuth state." });

        http.Response.Cookies.Delete("qbo_oauth_state");

        try
        {
            await oauth.ExchangeCodeAsync(code, realmId, ct);
            return Results.Ok(new { status = "connected", realmId });
        }
        catch (Exception ex)
        {
            return Results.Json(new { error = ex.Message }, statusCode: 502);
        }
    }
}
