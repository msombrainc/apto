# Requirements — apto-57-f5-sla-dashboard (apto#57)

**Refs:** Demo2-Plan F5 · FR-0501 … FR-0507

### FR-0501
SLA Dashboard SHALL show counts of open jobs: on-track, at-risk (≤ 2 days remaining per
existing `slaStatus`), and overdue.

### FR-0502
Dashboard SHALL show the same on-track / at-risk / overdue split **by facility** and **by
account** (top-level account name).

### FR-0503
Dashboard SHALL list at-risk and overdue open jobs sorted by urgency (`daysRemaining`
ascending — most overdue first).

### FR-0504
Each urgent job row SHALL link to `ROUTES.jobDetail(jobId)`.

### FR-0505
Dashboard SHALL show aggregate asset counts by status group (WIP / Finished / Exception)
summed across **open** jobs in the current filter scope.

### FR-0506
Dashboard SHALL support filters: facility and account (same account list as jobs list).

### FR-0507
Module map entry `sla-dashboard` SHALL navigate to the dashboard route (not jobs list).

### NFR-0501
`npm run gate:mr` SHALL include unit tests for aggregation helpers (facility/account splits,
urgent ordering, asset mix).
