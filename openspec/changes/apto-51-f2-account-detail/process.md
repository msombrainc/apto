# Process — F2 account save and audit

1. **Load** — User opens `/accounts/{id}`; client fetches `GET /api/accounts/{id}`, change log
   (first page), and `GET /api/jobs?accountId={id}` for the jobs panel.
2. **Edit** — User changes fields on the detail form; client-side hints for BR-0202–BR-0204; no
   autosave.
3. **Save** — Client sends `PUT /api/accounts/{id}` with full body including `settings`. Server
   validates, detects per-field diffs, writes `Account` row, appends `AccountChangeLog` rows (BR-0207),
   saves transaction.
4. **QBO enqueue** — If name or billing address changed, server enqueues F12 customer operation
   (BR-0208); sets account `qboSyncStatus` to pending when enqueue succeeds; response returns
   immediately.
5. **Sync now** — User triggers `POST /api/accounts/{id}/qbo-sync`; UI polls queue or refreshes
   account QBO fields after worker completes (same pattern as F12 admin).
6. **Change history** — User filters log by field or date range; client refetches
   `GET .../changes?field=&from=&to=`.
7. **Search** — User changes status filter on list; client calls `GET /api/accounts?status=&q=`;
   clicking name navigates to step 1.

**Rules storage:** toggling account rules or services updates JSON only; no downstream workflow
hooks in Demo 2 (BR-0206).
