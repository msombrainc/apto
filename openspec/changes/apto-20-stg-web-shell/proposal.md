# Change: STG React shell on :3012 (apto#20)

## Why

Argus confirmed 404 on `/` while API health worked; STG must serve the Vite build from the same Kestrel host as `/api/*`.

## What

- `UseStaticFiles` + `MapFallbackToFile` in `Program.cs`
- deploy-stg builds `apps/web` into `wwwroot` before `dotnet publish`

Related: #20
