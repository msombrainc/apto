# Proposal — apto-57-f5-sla-dashboard (apto#57)

**Slice:** SLICE-012 · Demo2-Plan F5

## Problem

Operations managers need a company-wide SLA health view: counts by status, breakdowns by
facility and account, asset status mix on open jobs, and a prioritized list of at-risk and
overdue jobs with drill-down — without exporting the jobs grid.

## Solution

Add **SLA Dashboard** at `ROUTES.slaDashboard` (`/operations/sla-dashboard`). Client-side
aggregation over the same `GET /api/jobs` payload used by F4 (no new API).

## Out of scope

- New backend endpoints or SLA rule changes (F3/F4 payloads suffice).
- Historical SLA analytics or email alerts.
