# Change: F12 QuickBooks sync queue

**Tracker:** msombrainc/apto#47 (SLICE-002, parent apto#43)  
**Change id:** `apto-47-f12-qbo-sync-queue`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F12, §7–§8, NFR-7

## Problem

Demo 1 creates QuickBooks customers **inline** on `POST /api/accounts` (`IQboCustomerSyncService`),
blocking the HTTP response and hiding failures from operators. Demo 2 requires **every** QBO call
(customer create/update, future invoice create) to pass through a **durable queue** with visible
status, automatic retries, and an admin screen — mirroring production AIMS ↔ QuickBooks Enterprise
(Web Connector) behavior at the UX/process layer.

## Desired outcome

1. **`QboSyncRequest`** persistence (EF migration + STG SQLite patch) with operation, entity link,
   payload, status, attempts, errors, and QBO ids.
2. **Background processor** (hosted service) that drains Pending rows oldest-first with ≤5 automatic
   attempts and backoff; no direct QBO HTTP from request threads after this slice.
3. **Queue API** — `GET /api/qbo/status`, `GET /api/qbo/requests`, `POST /api/qbo/requests/{id}/retry`.
4. **Refactor account flows** — account create/update enqueue customer operations; save responses
   do not wait on QBO.
5. **Admin UI** — QuickBooks Sync screen: connection state, filterable request list, retry, deep links
   to AIMS entity and QBO record when ids exist.

## Dependencies

- **SLICE-001 (apto#46)** merged or available on branch — shared Demo 2 migration discipline;
  F12 does not consume reference dropdowns directly but ships in the same integration wave.

## Out of scope (this slice)

- F11 service invoice create/send (queues `CreateInvoice` operations — **interface only**; no
  invoice UI or `ServiceInvoice` table in apto#47).
- Optional QBO panel balance/invoice query (Demo2-Plan §8 “if time allows”).
- Production Web Connector / qbXML transport (demo stays QBO Online Sandbox OAuth from Demo 1).
- Server-side role enforcement (Demo 2 has no roles; same pattern as apto#46 ASSUMPTION-465).

## UX / design

- `ux-charter-first` on apto#47 — Athena Mode B before implement; Hermes specifies **capabilities**,
  filters, columns, and `data-testid` hooks, not pixel layout (Figma Admin module).
