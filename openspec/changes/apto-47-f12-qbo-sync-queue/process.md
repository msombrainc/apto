# Process — F12 queue lifecycle

1. **Enqueue** — Domain action (account create/update, future invoice send) inserts `QboSyncRequest`
   with `Status = Pending`, `Attempts = 0`, serialized payload JSON, and entity link
   (`EntityType`, `EntityId`).
2. **Poll** — `QboSyncQueueWorker` wakes every ≤10 seconds (ASSUMPTION-471); if no row is
   `Processing`, selects oldest `Pending` by `CreatedAtUtc`.
3. **Send** — Worker marks row `Processing`, increments `Attempts`, calls existing QBO HTTP helpers
   with refreshed token; on success sets `Status = Sent`, `QboId`, `SentAtUtc`, updates linked
   entity (e.g. `Account.QboCustomerId`).
4. **Fail** — On transport or QBO error, set `Status = Failed` (or `Pending` if attempts < 5 and
   backoff elapsed), store `LastError` (human-readable, include Intuit error code when present).
5. **Retry** — User `POST .../retry` on Failed row: set `Status = Pending`, reset `Attempts` to 0
   (BR-1204), clear `LastError` optional.
6. **Not connected** — If no valid `QboConnection`, worker does not call QBO; rows stay `Pending`
   with `LastError` explaining not connected; status endpoint reports disconnected.
