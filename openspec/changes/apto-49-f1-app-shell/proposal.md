# Change: F1 App shell and navigation

**Tracker:** msombrainc/apto#49 (SLICE-004)  
**Change id:** `apto-49-f1-app-shell`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F1

## Problem

Demo 1 shipped a single `App.tsx` with view state and partial `history.replaceState` deep links.
Demo 2 requires a persistent shell with the **full module map**, URL-based routing, and **global
asset lookup** (F8 lookup API).

## Desired outcome

1. React Router paths for all shipped screens + `/inventory/assets/:assetId`.
2. Collapsible **module map** sidebar section (available vs phase-tagged unavailable entries).
3. Header **global asset lookup** (`data-testid="f1-global-asset-lookup"`) → inventory asset detail.
4. No backend changes.

## Out of scope

New feature screens (F2–F15); RBAC.
