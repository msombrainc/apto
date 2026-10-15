# Demo 2 Plan — "Dock to Invoice"

**Audience, in order:** UI/UX engineer (designs the experience), then FE and BE engineers.
This document says **what each screen must let the user do** and what data it works with. It
does not prescribe layout, visual style or component choice — those are the UI/UX engineer's call.

**Builds on:** Demo 1 (`msombrainc/apto`, PRs #4–#40). **Requirement IDs:** `Requirements-Extraction.md`.
**Phases referenced:** `Apto_AIMS_WBS_Estimation.xlsx`.

---

## 1. Goal and story

Show the widest possible slice of AIMS with small backend change and **no new third-party
integration**. QuickBooks Online Sandbox (already connected in Demo 1) is used further.

**Demo story:** a client's assets arrive → they are imported from the client's spreadsheet →
warehouse staff grade, set status and move them by scanning → managers watch job progress and
SLAs → the job is closed with a compliance certificate → a service invoice appears in QuickBooks.

**Scope rules**
1. Every new screen either reads existing data or writes through a small, generic backend change.
2. One third-party system only: QuickBooks Online Sandbox (more calls, same connection).
3. Screens marked **Prototype** use sample data in the browser, have no backend, and must say so on screen.

---

## 2. Starting point (built in Demo 1)

| Area | What exists |
|---|---|
| Login | Single hardcoded demo login (`demo` / `demo`). No roles. |
| Accounts | Search by name/code, create. Fields: Name, Code, three SLA day counts. Account create creates a QuickBooks customer (status `synced` / `failed` / `skipped`). Update endpoint exists, **no edit screen**. |
| Jobs | Create, list with SLA countdown and on-track / at-risk / overdue flag. Facility is a fixed GA/TX/CA list; Ops Status is free text. Update endpoint exists, **no edit screen**. |
| Assets | Add a single asset to a job (serial + part number, new part number allowed). Edit asset with change log (field, old, new, user, time). |
| Inventory | Search by serial/part number, filter by account, facility, job. Max 200 rows. |
| Part numbers | Search and create only. Category table exists with no screen or endpoint. |
| Tech | ASP.NET Core 10 + EF Core, SQL Server (SQLite on STG), React 19 + Vite, single `App.tsx` with 3 tabs, no router. |

---

## 3. Scope at a glance

| # | Feature | FR | FE | BE | QuickBooks |
|---|---|---|---|---|---|
| F1 | App shell and navigation | — | New | None | — |
| F2 | Account detail and edit | FR-9..12, 16, 17 | New | Extend | Customer update |
| F3 | Job detail and edit | FR-25, 27 | New | Extend | — |
| F4 | Jobs list v2 | FR-21..23 | Rework | Extend | — |
| F5 | SLA dashboard | FR-24, 70, 80 (SLA) | New | None | — |
| F6 | Asset import from spreadsheet | FR-31 | New | None | — |
| F7 | Bulk unserialized asset creation | FR-30 | New | None | — |
| F8 | Quick Scan | FR-38, 39 | New | Extend | — |
| F9 | Browse Inventory v2 | FR-47, 47a, 48 | Rework | Extend | — |
| F10 | Certificates of Recycling / Data Destruction | FR-73 | New | None | — |
| F11 | Service invoice to QuickBooks | FR-68, 75 | New | New | Item + Invoice |
| F12 | QuickBooks sync queue | FR-17, 68, NFR-7 | New | New | All calls go through it |
| F13 | Reference data admin | FR-41, 81a–e | New | New (generic) | — |
| F14 | Part Number management | FR-43, 44 | New | Extend | — |
| F15 | Prototype screens (4) | FR-7, 8, 40, 60, 61, 80 | New | None | — |

---

## 4. Rules that apply to every screen

- **Terminology.** Use the client's words: Account, Job, Asset, **Apto ID**, Part Number, Facility, Ops Status, Grade.
  SLA timers are **Input SLA, Settlement SLA, Sales SLA** (Demo 1 code calls them Receiving/Processing/Shipping — labels change, API names may stay).
- **Lists come from reference data (F13).** Facility, Location, Job (Ops) Status, Asset Status, Grade, Category dropdowns all read F13 — nothing hardcoded.
- **Apto ID is the asset's human identifier.** Show it wherever an asset appears; it is what users type or scan.
- **Change history.** Accounts and Assets show who changed what and when. Jobs do not in Demo 2.
- **Large lists** (jobs, inventory, part numbers, reference data) support search, sort and paging.
- **Errors are specific and recoverable.** Validation messages name the field; failed QuickBooks calls show the reason and a retry path (F12).
- **No roles.** Everyone is the demo user. Screens never hide actions by role in Demo 2.
- **Prototype banner** on every F15 screen: "Prototype — sample data, not connected".
- **Formats:** English, USD, US dates, desktop and tablet browsers (Chrome/Edge). Barcode scanners act as keyboards.

---

## 5. Feature specifications

Each feature lists: **User can** (capabilities the UI must support), **Rules**, **Not in Demo 2**,
then the work per side.

### F1 — App shell and navigation

**User can**
- Move between all Demo 2 screens from one persistent navigation.
- See the **full AIMS module map** (all views from `UI Views.xlsx`), with screens not yet built shown as unavailable and tagged with the delivery phase that brings them (e.g. "Phase 5 — Sales, Auctions, Invoicing & Fulfillment").
- Find an asset fast from anywhere by Apto ID or serial (opens the asset).
- See which user is logged in and log out.

**Module map (for the navigation)**

| Group | Screens (Demo 2 = available) |
|---|---|
| Operations | Jobs **(D2)**, SLA Dashboard **(D2)**, Quick Scan **(D2)**, Asset Import **(D2)**, ASN Page (Phase 2), Order Fulfillment (Prototype / Phase 5) |
| Inventory | Browse Inventory **(D2)**, Asset detail **(D2)**, Test Records (Phase 4), Wipe Logs & Certificates (Certificates **D2**, rest Phase 4), Asset Images (Prototype / Phase 3) |
| Accounts & Sales | Accounts **(D2)**, Invoices (Phase 5), Invoice Customers (Phase 5), Asset Pricing (Phase 5), Purchase Price Calculator (Phase 2) |
| Admin | Reference Data **(D2)**, Part Numbers **(D2)**, Manufacturers (Phase 3), Part Number Translation (Phase 4), User Management (Prototype / Phase 1), QuickBooks Sync **(D2)** |
| Dashboards | SLA **(D2)**, Production (Prototype / Phase 6) |

**FE:** routing (deep links per screen and per record), navigation, global asset lookup, module map as static config.
**BE:** none (global lookup uses F8's lookup endpoint).

---

### F2 — Account detail and edit

**User can**
- Open an account from the Accounts search and see all its information in one place.
- Edit: Name, Code, Status (Active/Inactive), Input / Settlement / Sales SLA days (new-account defaults 30 / 30 / 60), Apto consignment percentage (0–100).
- Maintain the **fee schedule**: a USD rate per unit for Audit, Wipe, Shred, Recycle, Bulk, Bulk Recycle, Storage, Teardown, Repair, OS Install, Redeploy. Blank = service not billed.
- Set **account rules** (on/off): Require Processing Approval, Require Recycle Approval, Require Sales Approval, Redeploy Only, Redeploy Bypass, Shred All Drives, Recycle Only, Require Shred Pictures, Require Damage Pictures.
- Set **service offerings** (on/off): OS Install / Imaging, Memory Install, Parts Replacement.
- Enter a **billing address** (sent to QuickBooks).
- See the account's **change history**: who, when, field, old value, new value; filter by field or date.
- See the account's **jobs** with their SLA flag and open any of them.
- See the **QuickBooks panel**: sync status, QuickBooks customer ID, last sync time, error if failed; trigger "Sync now"; open the customer in QuickBooks.
- Accounts search gains: status filter (Active / Inactive / Both), Apto %, and the three SLA columns.

**Rules**
- Code is unique (existing rule). SLA days are whole numbers ≥ 0. Apto % 0–100. Fee rates ≥ 0, two decimals.
- Saving name or billing address queues a QuickBooks customer update (F12); the save itself never waits on QuickBooks.

**Not in Demo 2:** rules are stored and shown, **not enforced** in processing; custom required fields (FR-13), report configuration (FR-14), price-deduction tables (FR-15), image-capture flags.

**FE:** account detail/edit screen, search screen update, change-history view, QuickBooks panel, label rename.
**BE:**
- `Account`: add `Status`, `Settings` (JSON: aptoPercentage, fees, rules, services, billingAddress).
- New table `AccountChangeLog` (same shape as `AssetChangeLog`); `PUT /api/accounts/{id}` writes it and queues a QuickBooks update.
- New `GET /api/accounts/{id}`, `GET /api/accounts/{id}/changes`, `POST /api/accounts/{id}/qbo-sync`.
- `GET /api/accounts` gains `status` filter and returns the new fields.
- Account create moves from an inline QuickBooks call to the queue (F12).

**QuickBooks:** Customer create (existing), Customer read + sparse update (new). See §8.

---

### F3 — Job detail and edit

**User can**
- Open a job from the Jobs list, Account detail or any asset and see everything about it.
- Edit: Account, Facility, Ops Status, start date, due date (due date defaults from the account's SLA).
- See **progress**: total assets, WIP, Finished, Exceptions, % complete; SLA days remaining and flag.
- See the job's assets (Apto ID, serial, part number, category, grade, status, location) and open any of them.
- Add assets three ways from the job: one at a time (Demo 1), **bulk unserialized** (F7), **from a spreadsheet** (F6).
- Generate a **certificate** for the job (F10).
- Create and send a **service invoice** (F11) and see its QuickBooks status.

**Rules**
- Ops Status values come from reference data, in this order: Pickup Scheduled, In Transit, Received, WIP, WIP Input Complete, Ops Complete with Exceptions, Ops Complete, Completed, Canceled.
- Adding assets to a job in **In Transit** or **Ops Complete** asks the user to confirm (FR-34).
- Due date cannot be before start date (existing rule).

**Not in Demo 2:** job change history (FR-26), automatic Ops Status transitions (FR-28), client-reference fields, Client Services Status.

**FE:** job detail/edit screen, progress summary, asset list, entry points to F6/F7/F10/F11.
**BE:**
- `GET /api/jobs` and `GET /api/jobs/{id}` add `assetCount`, `wipCount`, `finishedCount`, `exceptionCount`, `progressPct` (from Asset Status groups, F13).
- Facility and Ops Status validated against reference data instead of the hardcoded list.

---

### F4 — Jobs list v2

**User can**
- Filter by Account, Facility, Ops Status, SLA flag, and date ranges (created, start, due).
- By default see open jobs only (excludes Completed, Canceled, In Transit); switch to all.
- Choose and reorder visible columns: Job ID, Account, Account Code, Facility, Ops Status, Days since start, SLA days remaining, SLA flag, asset counts (WIP / Exceptions / Finished), Progress %.
- Sort by any column; export the current view to Excel.
- Open a job.

**FE:** filters, column chooser (remembered per browser), client-side Excel export.
**BE:** none beyond F3's counts.

---

### F5 — SLA dashboard

**User can**
- See counts of jobs on track, at risk (≤ 2 days) and overdue, company-wide or for one facility.
- See the same split **by facility** and **by account**.
- See a list of at-risk and overdue jobs, most urgent first, and open any of them.
- See the share of assets by status group (WIP / Finished / Exception) across open jobs.
- Filter by facility and account.

**FE:** dashboard built from `GET /api/jobs` data (aggregation in the browser).
**BE:** none.

---

### F6 — Asset import from spreadsheet

**User can**
- Choose a job (or start from the job page), then upload an `.xlsx` or `.csv` file.
- Map file columns to AIMS fields: Serial Number, Part Number, Category (optional), Grade (optional).
- Preview every row with its validation result before anything is saved.
- Decide what happens to unknown part numbers: create them, or skip those rows.
- Import, follow progress, then see a summary: created, skipped, failed (with reason per row).
- Download the failed rows as a file to fix and re-import.
- Open the job with the new assets.

**Rules (checked in preview)**
- Part number required. Serial optional but, if present, unique within the file and not already in AIMS.
- Unknown Grade or Category values are flagged as errors.
- Demo sizing: up to 500 rows per file.

**Not in Demo 2:** ASN storage and receipt matching (FR-18, FR-20), ASN mailbox scraper (FR-19).

**FE:** file reading, column mapping, preview/validation, sequential import with progress, results and error export.
**BE:** none — rows are created through the existing `POST /api/jobs/{jobId}/assets`; duplicate-serial check uses F8's lookup.

---

### F7 — Bulk unserialized asset creation

**User can**
- From a job, choose a part number (or the generic "UNIDENTIFIED" part number) and a quantity (1–500).
- Optionally set a starting Grade, Status and Location for all of them.
- Create them and get the list of new Apto IDs, exportable to Excel.

**FE:** form + loop over the existing create endpoint, results list.
**BE:** seed the "UNIDENTIFIED" part number; create endpoint accepts optional grade/status/location (F8).

---

### F8 — Quick Scan

Warehouse users update many assets by scanning, without opening each one.

**User can**
- Pick a **preset** or build one: choose which attributes to change — Grade, Asset Status, Location, Part Number — and for each, either a **fixed value** for every scan or **"ask per scan"**.
- Save presets for themselves; mark a preset as **global** (shared with everyone).
- Scan or type an **Apto ID or serial**; the asset is found and the preset applied immediately.
- Get instant success / failure feedback per scan (visual and sound), suitable for a scanner gun without looking at the screen.
- See a running log of this session: Apto ID, what changed, result; undo the last scan.
- Work fully from the keyboard/scanner (scan → apply → next scan).

**Rules**
- Unknown or ambiguous code (serial matches more than one asset) = failure with reason, nothing changed.
- Location must belong to the asset's job facility.
- Every change is written to the asset change history.
- Target: result shown in under 1 second per scan.

**Not in Demo 2:** cart/pallet IDs, add/remove damages, image capture during scan.

**FE:** preset builder and picker, scan loop, feedback, session log, undo (re-applies previous values). Presets stored in the browser.
**BE:**
- `Asset`: add `AptoId` (human-readable, unique, sequential, e.g. `A0001234`; backfill existing), `Grade`, `Status`, `Location`.
- `PUT /api/assets/{id}` accepts grade, status, location; validates against reference data; logs changes.
- New `GET /api/assets/lookup?code=` — exact match on Apto ID or serial; returns the asset or `404` / `409` (ambiguous). Indexed for speed.

---

### F9 — Browse Inventory v2

**User can**
- Search by Apto ID, serial, part number; filter by account, facility, job, category, grade, status, location, created date.
- **Paste a list** of Apto IDs or serials (one per line) to find them all at once; see which were not found.
- Choose visible columns; sort by any column; page through all results (no 200-row cap).
- Export the current results to Excel.
- **Save searches** (filters + columns) by name, set one as default, re-run them.
- Open any asset (detail + change history) or its job.

**Not in Demo 2:** sold inventory, account report runs (FR-47a), add to cart (FR-49).

**FE:** filter panel, paste-list lookup, column chooser, export, saved searches (stored in the browser).
**BE:** `GET /api/assets` adds paging (`page`, `pageSize`, `total`), `codes` (list lookup), filters for category/grade/status/location/date, and returns `aptoId`, `category`, `grade`, `status`, `location`.

---

### F10 — Certificates of Recycling / Data Destruction

**User can**
- From a job, choose the certificate type: **Recycling** or **Data Destruction**.
- Preview it: Apto as issuer, client account, job, facility, processing dates, list of covered assets (Apto ID, serial, part number, category, status), totals, compliance statement, signature block.
- Print or save as PDF.

**Rules**
- Recycling certificate covers assets with status in the "Recycled" group; Data Destruction covers "Wiped" and "Shredded". Others are listed as excluded with a count.
- Every certificate carries a visible "Sample" marking in Demo 2.

**Not in Demo 2:** certificate storage, numbering, bulk download, sanitization records from Blancco/EPS (Phase 4).

**FE:** certificate template and print view built from job + asset data.
**BE:** none.

---

### F11 — Service invoice to QuickBooks

Bills the client for the services performed on a job, using the account's fee schedule.

**User can**
- From a job, open an **invoice preview**: one line per billable service — service, quantity, unit rate (from the account fee schedule), amount — and the total.
- See how each default quantity was derived (e.g. "Audit = all 42 assets", "Wipe = 30 assets with status Wiped").
- Adjust quantities, remove lines, add a note.
- **Send to QuickBooks**; see status (Queued → Sent, or Failed with reason) and, once sent, the QuickBooks invoice number, total and a link to open it.
- See all invoices created for the job.

**Rules**
- Only services with a rate on the account appear.
- Default quantities: Audit = all assets on the job; Wipe = status Wiped; Shred = status Shredded; Recycle = status Recycled; other services start at 0.
- The account must be synced to QuickBooks first; otherwise the user is told and offered "Sync now" (F2).
- A job can have several invoices; each is sent once (no edit after sending in Demo 2).

**Not in Demo 2:** sales invoices to buyers (FR-56), consignment remittance (FR-76), non-inventory POs (FR-68), payments.

**FE:** invoice preview/editor, send action, status and history on the job.
**BE:**
- New table `ServiceInvoice` (JobId, AccountId, lines JSON, total, note, status, QuickBooks invoice ID and number, created by/at).
- New `GET /api/jobs/{id}/invoice-preview`, `POST /api/jobs/{id}/invoices` (saves and queues), `GET /api/jobs/{id}/invoices`.

**QuickBooks:** Item query/create (one Service item per fee type), Invoice create. See §8.

---

### F12 — QuickBooks sync queue

All QuickBooks calls go through a queue, so failures are visible and retryable. This also mirrors
the production design: QuickBooks Enterprise's Web Connector collects queued requests from AIMS.

**User can**
- See QuickBooks connection state (connected company, or "not connected" with a connect action).
- See every sync request: type (Create customer, Update customer, Create invoice), AIMS record (linked), status (Pending, Sent, Failed), attempts, last error, QuickBooks ID, times.
- Filter by status and type; retry a failed request; open the AIMS record or the QuickBooks record.

**Rules**
- Requests are sent automatically within a few seconds, oldest first, with up to 5 attempts and increasing delay.
- After 5 failures the request stays Failed until a user retries it.
- Typical failures the UI must explain: not connected, duplicate customer name in QuickBooks, customer not yet synced, token expired and refresh failed.

**FE:** queue screen, connection status, retry.
**BE:**
- New table `QboSyncRequest` (Operation, EntityType, EntityId, payload JSON, Status, Attempts, LastError, QboId, created/sent times).
- Background sender (hosted service) processing the queue; existing token refresh reused.
- New `GET /api/qbo/status`, `GET /api/qbo/requests?status=&type=`, `POST /api/qbo/requests/{id}/retry`.

---

### F13 — Reference data admin

One consistent admin experience for the lists that drive dropdowns.

**Lists:** Facilities, Locations (per facility), Job (Ops) Statuses, Asset Statuses, Grades, Damages, Categories.

**User can**
- View, search, add, edit, deactivate and reactivate entries; set display order.
- For **Locations**: choose the facility first; codes are unique within a facility.
- For **Asset Statuses**: assign each status to a group — WIP, Finished, Exception — and optionally to a certificate group (Recycled, Wiped, Shredded). Groups drive job progress (F3), dashboards (F5), certificates (F10) and invoice defaults (F11).
- For **Categories**: rename and see how many part numbers use each.
- See whether an entry is in use; entries in use can be deactivated but not deleted.

**Seed data:** facilities GA / TX / CA with a few locations each (e.g. Receiving, Audit Bench, Wipe Room, Shred Cage, Recycle Bay, Sellable Stock); statuses Received, In Audit, Wiped, Shredded, Recycled, Ready for Sale, Exception; grades U, A, B, C, D; the Ops Statuses listed in F3.

**Not in Demo 2:** damage-to-category applicability and grade restrictions (FR-81a detail), category sellable criteria (FR-63), carts (FR-42).

**FE:** one generic list/edit experience configured per list type.
**BE:**
- New table `ReferenceItem` (Type, Code, Name, ParentId, Group, CertificateGroup, SortOrder, IsActive).
- New `GET/POST /api/reference/{type}`, `PUT/DELETE /api/reference/{type}/{id}` (delete = deactivate if in use).
- New `GET/POST/PUT /api/categories` (table exists).
- Seed data; replaces `GET /api/jobs/facilities`.

---

### F14 — Part Number management

**User can**
- List and search part numbers with category and the number of assets using each.
- Add and edit (number, category).
- Delete a part number; if assets use it, **choose a replacement** first and see how many assets will be moved.

**Rules:** part number unique (existing). Delete with assets is impossible without a replacement.

**Not in Demo 2:** AI validation and duplicate detection (FR-43 API check, FR-46), part number change log (FR-45), weight/manufacturer/attributes.

**FE:** list, add/edit, delete-with-replacement flow.
**BE:** `GET /api/part-numbers` adds paging and asset counts; new `PUT /api/part-numbers/{id}`, `DELETE /api/part-numbers/{id}?replacementId=` (moves assets, logs the change on each asset).

---

### F15 — Prototype screens (sample data, no backend)

Shown to illustrate later phases. Each must carry the prototype banner. Data lives in the browser
and resets on reload.

| Screen | Phase | User can (as designed for the real build) |
|---|---|---|
| User Management | 1 | Search users; see and toggle feature-level permissions in a user × feature grid (create/edit accounts, jobs, part numbers, invoices…); see an access-change history; export an access review. |
| Order Fulfillment — Pull & Pack | 5 | Pick an unshipped invoice by facility; scan its assets in the Pull step with match / not-on-invoice / already-scanned feedback (visual + sound); repeat in the Pack step; enter weight and dimensions; mark as staged, then shipped with tracking number. |
| Production Dashboard | 6 | See output by facility, by user and by category over a chosen period; see run rate per day. |
| Asset Images | 3 | Capture up to 3 photos per asset from the device camera; view, retake, delete, download. |

**FE:** screens with local sample data. **BE:** none.

---

## 6. Data model changes (all on one migration + STG SQLite patch)

| Change | Type | Used by |
|---|---|---|
| `Asset.AptoId`, `Grade`, `Status`, `Location` | 4 new columns (+ unique index on AptoId, index on SerialNumber) | F3, F5, F8–F11 |
| `Account.Status`, `Account.Settings` (JSON) | 2 new columns | F2, F11 |
| `ReferenceItem` | New table | F13 and all dropdowns |
| `AccountChangeLog` | New table | F2 |
| `QboSyncRequest` | New table | F12 |
| `ServiceInvoice` | New table | F11 |

Each change needs an EF migration **and** a matching update in `SqliteStgSchemaPatcher` (STG runs SQLite).

---

## 7. API summary

**Reused unchanged:** `POST /api/accounts`, `POST /api/jobs`, `PUT /api/jobs/{id}`, `GET/POST /api/jobs/{jobId}/assets`, `GET /api/assets/{id}`, `POST /api/part-numbers`, QuickBooks OAuth endpoints.

**Changed**

| Endpoint | Change |
|---|---|
| `GET /api/accounts` | `status` filter; returns status and settings |
| `PUT /api/accounts/{id}` | accepts status and settings; writes change log; queues QuickBooks update |
| `GET /api/jobs`, `GET /api/jobs/{id}` | asset counts and progress |
| `POST /api/jobs`, `PUT /api/jobs/{id}` | facility and status validated against reference data |
| `POST /api/jobs/{jobId}/assets` | optional grade, status, location; assigns Apto ID |
| `PUT /api/assets/{id}` | grade, status, location (validated, logged) |
| `GET /api/assets` | paging, code-list lookup, new filters and columns |
| `GET /api/part-numbers` | paging, asset counts |

**New (~17)**

| Endpoint | Feature |
|---|---|
| `GET /api/accounts/{id}` | F2 |
| `GET /api/accounts/{id}/changes` | F2 |
| `POST /api/accounts/{id}/qbo-sync` | F2, F12 |
| `GET /api/assets/lookup?code=` | F1, F6, F8 |
| `PUT /api/part-numbers/{id}` | F14 |
| `DELETE /api/part-numbers/{id}?replacementId=` | F14 |
| `GET/POST /api/reference/{type}` | F13 |
| `PUT/DELETE /api/reference/{type}/{id}` | F13 |
| `GET/POST/PUT /api/categories` | F13 |
| `GET /api/jobs/{id}/invoice-preview` | F11 |
| `POST /api/jobs/{id}/invoices`, `GET /api/jobs/{id}/invoices` | F11 |
| `GET /api/qbo/status` | F12 |
| `GET /api/qbo/requests`, `POST /api/qbo/requests/{id}/retry` | F12 |

---

## 8. Third-party API: QuickBooks Online Sandbox

Same app, OAuth connection, token refresh and base URL as Demo 1 (`/v3/company/{realmId}/…`).
No new credentials, accounts or vendors.

| Call | When | Notes |
|---|---|---|
| `POST /customer` | Account created | Existing. Moves into the queue. `DisplayName` must be unique in QuickBooks (error 6240 → shown in F12). |
| `GET /customer/{id}` + `POST /customer` (`sparse: true`, `Id`, `SyncToken`) | Account name or billing address changed | New. Read first to get the current `SyncToken`. |
| `GET /query?query=select * from Item where Name = '…'` | Before first invoice per fee type | New. Finds the Service item ("AIMS – Audit", "AIMS – Wipe", …). |
| `GET /query?query=select * from Account where AccountType = 'Income'` + `POST /item` (`Type: Service`, `IncomeAccountRef`) | Item not found | New. Creates the Service item once; ID cached in AIMS. |
| `POST /invoice` (`CustomerRef`, `Line[]` with `SalesItemLineDetail` {`ItemRef`, `Qty`, `UnitPrice`}, `PrivateNote` = AIMS job ID) | Invoice sent (F11) | New. Store returned `Id`, `DocNumber`, `TotalAmt`. |
| Optional: `GET /customer/{id}` (`Balance`) + `select * from Invoice where CustomerRef = '…'` | Account QuickBooks panel | Open balance and recent invoices. Add only if time allows. |

Limits are not a concern at demo volume (500 requests/minute per company).

**Important for the client conversation:** Apto's production QuickBooks is **Enterprise (desktop)**, reached through Intuit Web Connector (qbXML). The demo proves the **business flow, queue and screens**; only the transport changes for production. Say this explicitly when showing F11–F12.

---

## 9. Demo script (about 15 minutes)

1. Show navigation and the module map (F1): what exists now, what comes in which phase.
2. Open an account; set fees and billing address; show the change history and QuickBooks panel (F2, F12).
3. Open a job; import the client's spreadsheet of 40 assets, including one bad row (F6); fix and re-import it.
4. Add 10 unserialized assets in bulk (F7).
5. Quick Scan: preset "Audit → Grade per scan, status In Audit, location Audit Bench"; scan 5 assets; then preset "Wipe → status Wiped"; show a failed scan and an undo (F8).
6. Job progress and SLA dashboard update (F3, F5); open an overdue job from the dashboard.
7. Browse Inventory: paste a list of serials, filter by status, export, save the search (F9).
8. Generate the Data Destruction certificate (F10).
9. Create the service invoice; send it; open it in QuickBooks; show the queue, including a retried failure (F11, F12).
10. Admin: add a location, a new asset status in the Exception group; rename a category; delete a part number with replacement (F13, F14).
11. Prototypes, clearly labelled: permissions grid, Pull & Pack scanning, production dashboard (F15).

---

## 10. Out of scope for Demo 2

Real login, SSO, roles and permission enforcement · AD / Google Workspace / Office 365 · Bidlogix, Blancco, Phonecheck, EPS, Netchex, Azure AI · ASN storage and email scraper · account rule enforcement, custom required fields, report builder, price-deduction tables · parent/child and bound assets · carts, sales/recycle invoices, auctions, fulfillment (prototype only) · test records, sanitization records · label printing · data migration.

## 11. Risks and assumptions (Demo 2 only)

- QuickBooks Sandbox stays connected; refresh token is re-verified a day before the demo.
- Sample spreadsheet and printed barcodes (Apto IDs and serials) for scanning are prepared outside the app.
- Spreadsheet import creates assets one by one; fine to 500 rows, not representative of production bulk performance.
- Browser-stored presets and saved searches are per device; production stores them per user (FR-6, FR-48).
- Prototype screens can be read as finished features; banner and verbal call-out are mandatory.
