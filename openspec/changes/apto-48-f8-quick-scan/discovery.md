# Discovery — apto#48 F8 warehouse scan

## Problem / outcome

Warehouse staff need to apply the same grade/status/location updates across dozens of assets using a
barcode gun or keyboard, with immediate pass/fail feedback and an audit trail. Global search (F1)
and asset import (F7) need the same lookup contract.

## Actors

- **Warehouse operator** — runs presets (e.g. Audit → Grade per scan, status In Audit, location
  Audit Bench); scans Apto IDs or serials; undoes mistakes.
- **Lead / supervisor** — may mark a preset as global so all operators see it (FR-39, Demo 2
  simplified: any logged-in demo user may create global presets — ASSUMPTION-484).
- **System** — validates codes, applies updates, writes change log, enforces facility-scoped
  locations.

## Current state

- `Asset` has serial, part number, job link, change log; no `AptoId`, grade, status, or location.
- `PUT /api/assets/{id}` updates serial and part number only.
- No `GET /api/assets/lookup`.
- No Operations → scan route in the web app.

## Future state (F8)

- Each asset has unique `AptoId` (e.g. `A0001234`); lookup by `AptoId` or exact serial.
- Scan page loads a preset, reads a code, lookup → apply preset fields via PUT → show result in
  session log; undo restores previous field values from the last successful apply.
- F1 global search calls the same lookup endpoint (implementation may land in this MR or a thin
  follow-up; contract is in scope).

## Constraints

- Target **1 second** end-to-end per scan (lookup + apply) on seeded CI data (Demo2-Plan §F8).
- English UI; desktop + tablet; scanner sends Enter after code.
- STG SQLite schema parity via `SqliteStgSchemaPatcher`.
- Location must belong to the asset job facility (BR-1404).

## Unknowns (resolved in assumptions)

- `AptoId` allocation algorithm and backfill order → ASSUMPTION-481.
- Preset storage shape and global flag → ASSUMPTION-482.
- Audio feedback implementation → ASSUMPTION-483.

## Draft in / out of scope

**In:** migration, lookup, extended PUT/create optional fields, scan UI, presets in localStorage,
integration tests, E2E hooks for scan happy path and failure cases.

**Out:** F9 list enhancements, cart/pallet, damages on scan, server preset API, mobile RF native app.
