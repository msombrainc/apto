# UX charter — apto#60 F15 prototype screens (×4)

**Banner (all routes):** `Prototype — sample data, not connected` — top `AlertBanner` variant `prototype`, `data-testid="f15-prototype-banner"`.

| Route | Screen |
|---|---|
| `/admin/user-management` | User Management — search, permissions grid toggles, access history table, export button (no-op) |
| `/operations/order-fulfillment` | Pull & Pack — invoice picker, pull scan + pack scan steps, weight/dims, staged → shipped |
| `/dashboards/production` | Production — facility filter, period, output by user/category, run rate stat |
| `/inventory/asset-images` | Asset Images — pick sample asset, up to 3 photo slots (file input), view/retake/delete |

## Visual

- Reuse `dashboard-panel`, `DataTable`, `AimsButton`, `FacilityPills` where applicable
- Module map links enabled for prototype entries (tag unchanged)
- No API calls; sample data in `apps/web/src/prototype/f15SampleData.ts`
