# Requirements — apto-49-f1-app-shell (apto#49)

Refs: FR-F1-01 … FR-F1-06 (Hermes BA spec on apto#49).

## FR-F1-03 Routing

The web app SHALL register routes: `/accounts`, `/jobs`, `/inventory`, `/inventory/assets/:assetId`,
`/operations/scan`, `/admin/reference-data`, `/admin/qbo-sync`, and redirect `/` → `/accounts`.

## FR-F1-02 Module map

The shell SHALL render static module map config from `apps/web/src/routing/moduleMap.ts` matching
Demo2-Plan §F1 groups; unavailable entries are `aria-disabled` with phase tags.

## FR-F1-04 Global lookup

The authenticated header SHALL call `lookupAssetByCode` and navigate to `/inventory/assets/{id}` on success.
