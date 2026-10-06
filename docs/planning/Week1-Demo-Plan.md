# Week-1 PoC Demo Plan (derived from Full-Scope WBS)

Source: `Apto_AIMS_WBS_Estimation.xlsx` ("WBS Estimation" sheet; 97 FR rows post-audit, 7
roles, PERT). Demo rows are flagged `Demo Scope (Week 1) = Yes/Partial` in that sheet.
This doc explains the carve-out, stack, and day-by-day build plan.

---

## Demo Scope Selection Criteria

Four criteria drove which WBS rows made the cut, in priority order:

1. **1-week AI-SDLC delivery confidence.** Only FRs where the *demo-sized slice* is a
   pattern AI codegen tools handle very reliably — CRUD forms, EF Core entities/migrations,
   date/SLA math, list/search/filter UI — not FRs needing new infrastructure, multi-system
   identity federation, or hardware/device integration to even get a basic path working.
2. **Exactly one integration, and it must be low-risk.** Compared against every other
   integration in the WBS (Bidlogix, Blancco, Phonecheck, EPS/ODBC, QuickBooks):
   - **QuickBooks Online Sandbox — chosen.** Official Intuit .NET SDK, standard OAuth2,
     a free sandbox company provisions in minutes, and it produces a visible, external
     "wow" moment (Account created in AIMS → appears live as a Customer in QuickBooks).
   - **Rejected:** Bidlogix (FR-54/55/67) and Blancco (FR-64) need a live partner/vendor
     account we don't control the provisioning timeline for; Phonecheck (FR-65) needs
     physical device-originated data; EPS (FR-66) is an ODBC link into a *different*
     legacy database we don't have access to. All four risk burning the week on access/
     environment setup instead of building.
3. **One coherent vertical slice, not a grab-bag.** The story is Account → Job → Asset →
   Inventory (with SLA visibility throughout), not a sampler across unrelated modules.
   This keeps the list "big enough" to touch every layer of the stack (data model, CRUD,
   calculated/business logic, search/filter, external integration) while staying small
   enough to actually finish and rehearse using the AI Factory in 1–2 days.
4. **Simplification, not full delivery.** Every included row is built as a deliberately
   reduced slice (see "Simplification vs. full WBS" column below) — full WBS hours for
   these rows (per `Apto_AIMS_WBS_Estimation.xlsx`) range from ~5h (FR-35) to ~59h (FR-11)
   per role; the demo only builds the minimal cross-section needed to tell the story, not
   the full feature.

**Explicitly excluded, with reasoning:**
| Excluded | Why |
|---|---|
| FR-2–FR-8, FR-7a (Identity/AD/Google/O365/SSO, RBAC) | Multi-system identity federation; demo uses a single hardcoded login instead. |
| FR-18–FR-20 (ASN upload/email scraper) | File/email ingestion pipeline, not core to the vertical-slice story. |
| FR-38–FR-42 (Quick Scan, image capture, location hierarchy) | Config-driven extensibility features; high UI complexity relative to first-demo payoff. |
| FR-54, FR-55, FR-64, FR-65, FR-66 (Bidlogix, Blancco, Phonecheck, EPS) | External accounts / hardware / legacy ODBC access outside our control — see criterion 2. |
| FR-53, FR-56a–f, FR-57–FR-62, FR-67, FR-68 (carts, sales/recycle invoicing, order fulfillment) | Separate downstream module; would double scope without reinforcing the chosen integration story. |
| FR-63, FR-71–FR-82 (dashboards, secondary admin views, compliance/reporting) | Reporting/compliance layer — best shown once the core data model is proven, not in week 1. |

---

## Stack Decision

**Recommendation: .NET 8 (ASP.NET Core Web API) + EF Core + SQL Server + React/TypeScript, via Docker Compose.**

Reasoning (you asked "what's the best fit" and flagged SQL Server must stay — TC-1):

| Factor | Why .NET wins here |
|---|---|
| TC-1 (SQL Server 2025) | `Microsoft.Data.SqlClient` + EF Core are first-party, zero-friction. Node works too (mssql/tedious, Prisma has partial SQL Server support) but is a second-class citizen there — more plumbing, weaker migrations tooling. |
| FR-2/3/4/5 (AD, Google Workspace, O365, SSO) | .NET has native, well-maintained libraries for both worlds: `System.DirectoryServices` for on-prem AD and Microsoft Graph SDK for O365, plus standard OAuth libs for Google — all of this is on your roadmap even if cut from week 1. |
| "Demo should keep evolving" | EF Core migrations give you a real, versioned schema from day 1 instead of a throwaway script — the week-1 codebase becomes the actual project skeleton, not a prototype you rewrite. |
| QuickBooks integration | Intuit publishes an official .NET SDK (`IppDotNetSdkForQuickBooksApiV3`); OAuth2 + sandbox flow is well documented for .NET. |
| AI SDLC tooling | Copilot/agents generate ASP.NET controllers, EF entities/migrations, and React components equally well — no productivity loss choosing .NET over Node. |

**Local run:** `docker-compose.yml` with 3 services — `sqlserver` (mssql/server image, SQL Server 2022 is the latest Linux-container-available version; forward-compatible schema for 2025), `api` (ASP.NET Core, hot-reload via `dotnet watch`), `web` (React+Vite dev server). Everything runs with `docker compose up` — no cloud dependency except the QuickBooks Sandbox OAuth call.

### QuickBooks Sandbox — Setup & Implementation Notes

Setup is same-day, no approval needed (app review is only required before going to a
*production*/live company, not for sandbox use):
1. Free signup at developer.intuit.com → create an app → sandbox company auto-provisions
   with seeded sample data (chart of accounts, customers, items).
2. Sandbox Client ID/Secret are separate from production keys (no risk of touching a real company).
3. Register a `localhost` redirect URI, run the OAuth2 Authorization Code flow once to get
   access + refresh tokens.

**Known quirks to build around (small, not schedule-risking):**
- **Access token expires in 1 hour; refresh token in 100 days** — every API call needs the
  current access token.
- **Refresh token rotates ~every 24 hours.** The app must persist the *latest* refresh
  token after every refresh call — reusing a stale one fails. This is the #1 real-world
  gotcha; needs a small token-persistence routine (a few lines), not a redesign.
- **Revoked consent invalidates all tokens** — handle 401 by attempting a refresh, and if
  that fails, prompt for re-authorization rather than crashing.
- Rate limit: 500 requests/min per sandbox company — a non-issue at demo scale.
- Inactive sandbox companies can get reset — re-verify sample data a day or two before the
  live demo.

---

## Demo Scope: "Job Intake & SLA-Tracked Inventory" + QuickBooks Sync

Carved directly from the WBS (see CSV `Demo Scope` column). **Full WBS hours ≠ demo hours** — the
rows below are built as a deliberately simplified vertical slice (fewer fields, no granular RBAC,
hardcoded single login), intended to evolve into the full FR later, not to already satisfy it.

**Scope is full-stack — both Backend and Frontend, every day**, not an API-only or FE-mockup
demo. Each day pairs the API work with its corresponding UI (e.g., Day 2 = "Account CRUD API+UI")
so the week ends with a working, clickable product, not just endpoints:
- **Backend:** ASP.NET Core Web API + EF Core + SQL Server — entities/migrations, Account/Job/
  Asset CRUD endpoints, SLA calculation logic, QuickBooks OAuth2 + sync service.
- **Frontend:** React/TypeScript UI — Account form/search, Job create/edit, Jobs list with SLA
  color flags, Asset intake + edit screens, Browse Inventory search/filter table.

**Features implemented by end of week 1:**
1. Account management — create/search Customer Accounts (Name, Code, SLA timers).
2. QuickBooks sync — Account auto-creates as a Customer in QuickBooks Online Sandbox (live, via OAuth2).
3. Job management — create/edit Jobs under an Account (Facility, Ops Status, dates).
4. SLA tracking — automatic day-countdown + color-coded status (on-track/at-risk/overdue) on the Jobs list.
5. Asset intake — manual asset creation with part-number lookup, linked to a Job.
6. Asset edit — single-asset detail/edit view with change log.
7. Browse Inventory — searchable/filterable table of all assets across jobs.
8. *(Stretch only)* AI-assisted part-number/category validation stub on asset creation.

**Self-containment check:** every included feature's data dependencies trace back to another
included FR — with two explicit simplifications needed to close small gaps where the "real"
owning FR is out of scope for week 1:
- **Facility (used in FR-25 Job creation)** — the only FR that defines a real Facilities
  table/CRUD is **FR-41**, which is excluded this week. Demo simplification: **Facility is a
  hardcoded seed list (GA/TX/CA)**, a dropdown only, not a managed entity — avoids depending on
  an out-of-scope FR while keeping the Job form functionally complete.
- **Change log (shown on Asset edit, FR-37)** — full auditability is **NFR-6**, which is not a
  selected FR. Demo simplification: a **lightweight, Asset-only audit trail** (field, old value,
  new value, user, timestamp on each edit) — just enough to make the Demo Script's "show the
  change log" step real, without building full cross-entity auditability (Accounts/Jobs/Part
  Numbers/Invoices) described in NFR-6.

| WBS Row | Included this week | Simplification vs. full WBS |
|---|---|---|
| FR-1 | Yes | Only Account/Job/Asset/PartNumber/Category tables (not full Invoice/Customer model) |
| FR-9, FR-10, FR-11 | Partial | Account search + create/edit limited to Name, Code, 3 SLA timers (no fees/rules/custom fields/report builder); FR-10's default result columns shown in simplified form |
| FR-17 | **Yes — chosen integration** | QuickBooks Online Sandbox: creating an Account in AIMS creates the matching Customer in QBO via OAuth2 |
| FR-21, FR-22, FR-23 | Partial | Jobs list + SLA day countdown; skips export, saved columns |
| FR-24, FR-70 | Partial | SLA status shown as a color-flagged list (on-track/at-risk/overdue), not the full chart/board; FR-70's SLA monitoring is this simplified slice only |
| FR-25, FR-27 | Yes | Create/Edit Job with Facility (hardcoded GA/TX/CA seed list — see self-containment note), Ops Status, dates; add assets inline |
| FR-29, FR-35 | Yes | Manual single-asset creation with part-number lookup |
| FR-37 | Yes | Single asset edit view, with a lightweight Asset-only change log (see self-containment note) |
| FR-47 | Partial | Browse Inventory: basic filter/search table, no export/saved search |
| FR-69/FR-43 (AI validation) | Optional stretch | If time remains: stub an LLM call that "validates" a part number/category on asset creation — ties the AI-SDLC theme into the product itself |

**Explicitly cut this week** (full list in WBS): AD/Google/O365 provisioning & SSO, granular RBAC,
Client Required Fields builder, ASN upload/email scraper, Quick Scan, image capture, location
hierarchy, Bidlogix/Blancco/Phonecheck/EPS/Netchex, carts/invoices/order fulfillment, dashboards
beyond the SLA list, secondary admin CRUD screens, certificates generation.

---

## Demo Script
1. Create an Account (with SLA timers) → show it instantly appears in the QuickBooks Sandbox as a Customer.
2. Create a Job under that account → show SLA countdown starts.
3. Add 2–3 Assets to the Job via manual entry (part-number lookup) → optional: AI "validates" part number/category live.
4. Open Jobs list → show SLA color flags (seeded data makes one job red/overdue, one yellow, one green).
5. Open Browse Inventory → search/filter the assets just created.
6. Open the asset edit page → show the change log.

---

## Risks / Assumptions
- Assumes a QuickBooks Developer account + sandbox company can be provisioned same-day (typically instant, free).
- "AI part-number validation" stretch goal needs an LLM API key (OpenAI/Azure OpenAI) — treat as optional, cut first if time is tight.
- SQL Server 2025 isn't yet available as a public Docker image; using SQL Server 2022 container locally is assumed acceptable for the PoC (schema/EF Core code is forward-compatible).
- Demo auth is a single hardcoded login — explicitly not representative of FR-2/3/4/5 and should be called out as such live.
