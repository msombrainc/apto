# Proposal — apto-60-f15-prototypes (apto#60)

**Slice:** Demo2-Plan §F15 · UX charter `docs/ux/apto-60-f15-prototypes-charter.md`

## Problem

Later-phase AIMS capabilities (user permissions, Pull & Pack, production analytics, asset
imaging) need demo-ready UI without backend work so stakeholders can see scope and flow.

## Solution

Four **prototype** routes with local sample data (`apps/web/src/prototype/f15SampleData.ts`),
shared `PrototypeBanner`, and module-map deep links. No API calls.

| Route | Screen |
|---|---|
| `/admin/user-management` | User search, permission toggles, access history |
| `/operations/order-fulfillment` | Invoice pick, pull/pack scan, ship |
| `/dashboards/production` | Facility / period output tables + run rate |
| `/inventory/asset-images` | Sample asset picker, three photo slots |

## Out of scope

- Real auth, permissions persistence, invoice/shipment APIs, production ETL, camera storage.

Related: apto#60
