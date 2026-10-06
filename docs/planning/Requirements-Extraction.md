# Apto — Requirements Extraction (v2 — post-output-audit)

**Sources:** `Nexus Requirements.docx`, `Project RFP Questions.docx`, `UI Views.xlsx`, `NewAIMsTableMatrix.pdf`

**v2 revision note:** This is a revised pass following a cross-check of the original v1
extraction (82 FR / 15 NFR / 14 TC / 16 BC) against the source documents and the
`requirements-extractor` skill's quality checklist. Changes made in v2 (see Extraction
Notes at the end for full detail): 6 new FRs added (found in `UI Views.xlsx`, missed in
v1), 2 FRs split into atomic sub-items (FR-56, FR-81 — now 97 FR rows total), 1 FR
reworded to match source exactly (FR-17), 2 NFRs removed as feature-duplicates of
existing FRs (old NFR-3/NFR-4), 1 TC removed as a capability-duplicate (old TC-11), and
1 TC reworded to remove an overstated claim (old TC-14, now TC-13).

---

## Business Context Summary

- **Industry/Domain:** IT Asset Disposition (ITAD) — reverse logistics for IT/electronics equipment (intake, grading, data sanitization, refurbishment, resale, recycling).
- **Business Problem:** Apto needs a new ERP/WMS — internally referred to as **AIMS** — to replace/supersede the current Warehouse Management System. The current WMS's feature set was used as the baseline for an existing estimate, which the client (Sombra) is now challenging via a formal RFP, asking for re-validated requirements, a traceability matrix, and a revised work-breakdown estimate.
- **Target Users:** Warehouse/operations staff across 3 facilities (GA, TX, CA), Client Services, system Admins, Finance/Accounting, order fulfillment teams, and privileged/restricted user roles.
- **Core Client Need:** A scalable, multi-facility ERP that provides full lifecycle traceability of every asset (chain of custody) from receipt to final disposition, enforces customer-specific processing rules and SLAs, integrates with accounting/HR/identity/auction/auditing systems, and supports sales, recycling, and redeployment channels — delivered by a vetted vendor under a clear methodology, team structure, governance, and IP/security terms.

**Key Terminology**
- **AIMS**: Apto Inventory Management System (the new ERP/WMS being built)
- **ITAD**: IT Asset Disposition
- **Apto ID**: Unique identifier assigned to each physical asset
- **ASN**: Advanced Shipping Notice (client-provided manifest of incoming assets)
- **SLA**: Contractual timers — Input SLA, Settlement SLA, Sales SLA — tracked per account/job
- **WIP**: Work in progress (an asset/job processing status)
- **Bound/Unbound & Parent/Child**: Relationships between assets (e.g., a component removed from or installed into another asset)
- **Grade**: Condition classification of an asset (e.g., "U" = ungraded)

---

## Functional Requirements

| ID | Description |
|----|-------------|
| FR-1 | The system shall model core objects: Accounts, Jobs, Assets (Apto IDs), Part Numbers, Categories, Invoices, Invoice Customers, and Customer Shipping Information. |
| FR-2 | The system shall provision user accounts automatically when a user is created in on-premise Active Directory, pushing the account to Google Workspace and Office 365. |
| FR-3 | The system shall support AD-driven user groups: ERP User, ERP Admin, Google Basic, Google Enterprise, and Office 365 User, each granting corresponding downstream licenses/access. |
| FR-4 | The system shall synchronize password updates across Active Directory, Google Workspace, and Office 365 from a single AD-driven change. |
| FR-5 | The system shall support Single Sign-On (SSO) to the ERP via the user's Google Workspace account. |
| FR-6 | Users shall be able to save and retain preset values for selected application features. |
| FR-7 | The system shall provide a User Management page (Admin-only) to search, view, and edit user access levels. |
| FR-7a | The system shall provide an access-review report showing all grant/revoke changes to user permissions, exportable for audit purposes. |
| FR-8 | Admins shall be able to grant/revoke granular feature-level access per user (e.g., create/edit accounts, create/edit jobs, edit job status only, create/edit part numbers, create/edit recycle invoices, create/edit sales invoices, edit unshipped invoices, edit shipped invoices, create/edit buyer information). |
| FR-9 | The system shall provide an Account Management page to search accounts by full/partial name, account number, or account code, with status filters (Active/Inactive/Both) and selectable result columns. |
| FR-10 | The Account Management results table shall display, by default: Account Name (linked to edit page), Account Code, Status, Apto Percentage, Input SLA, Settlement SLA, and Sales SLA, loaded alphabetically by default. |
| FR-11 | The system shall provide an Account Create/Edit page capturing: Account Name, unique 3-character Account Code, SLA timers (Input default 30, Settlement default 30, Sales default 60), Apto consignment percentage (0–100%), fee schedule (Audit, Wipe, Shred, Recycle, Bulk, Bulk Recycle, Storage, Teardown, Repair, OS Install, Redeploy), image-capture requirement flags, and service offerings (OS Install/Imaging, Memory Install, Parts Replacement). |
| FR-12 | The system shall support configurable, per-account boolean Account Rules (e.g., Require Processing/Recycle/Sales Approval, Redeploy Only, Redeploy Bypass, Shred All Drives, Recycle Only, Require Shred/Damage Pictures). |
| FR-13 | The system shall allow definition of custom "Client Required Fields" per account (field type, label, validation/data type, dropdown options, applicability to Asset vs. Job creation, required flag, uniqueness flag, and an "NA" bypass option). |
| FR-14 | The system shall let users define per-account report configurations by selecting the number and source of report columns from available database/custom fields, the report trigger, and delivery method. |
| FR-15 | The system shall support per-account purchase-price calculation (buy-price deduction) tables based on asset configuration, condition, and damages. |
| FR-16 | The system shall log account creation (creator, date) and all edits (user, date, changes) and provide a change-log view from the Edit Account page. |
| FR-17 | Creating an account in AIMS shall automatically create the corresponding account in QuickBooks, with the account name populated from AIMS at creation time. |
| FR-18 | The system shall allow users to upload Advanced Shipping Notice (ASN) spreadsheets capturing client reference numbers, part number, serial number, client ID, and tracking number. |
| FR-19 | The system shall include an email scraper that automatically retrieves ASN files sent via email (e.g., to ASN@aptosolutions) and ingests them. |
| FR-20 | Users shall be able to select asset groups from uploaded ASN data by client reference number and generate new Jobs from that data. |
| FR-21 | The system shall provide a Jobs page to search, filter, sort, and export Job records, defaulting to all jobs not in Completed, Canceled, or In-Transit status. |
| FR-22 | The Jobs table shall display (configurable/selectable columns): Job ID (linked), Account Code, Client ID, Facility, Ops Status, Client Services Status, Days Since Received, Input/Processing/Sales SLA countdowns, WIP/Exceptions/Recycle/Finished asset counts, and overall completion Progress %. |
| FR-23 | Users shall be able to filter Jobs by Account, Facility, Ops Job Status, Client Services Status, and by date range (Date Created, Date Received, Input SLA Due, Settlement Due). |
| FR-24 | The system shall provide a Jobs Dashboard showing jobs per facility with SLA status (approaching/overdue/on-track), switchable between views by asset count, category, or account, with filters and visual charts. |
| FR-25 | The system shall provide a Create/Edit Job page capturing Account (searchable by name/code/ID), Facility, client-reference fields, Ops Status (Pickup Scheduled, In Transit, Received, WIP, WIP Input Complete, Ops Complete with Exceptions, Ops Complete), Client Services Status, Expected Received Date, Received Date, Input Completion Date, Ops Completed Date, and Actual Completion Date. |
| FR-26 | The system shall record the creating user and creation date on each Job, log all edits (user, date, changes), and provide a change-log view on the Edit Job page. |
| FR-27 | The system shall allow adding assets to a Job directly from the Edit Job page. |
| FR-28 | The system shall automatically transition Job Ops Status based on asset state: WIP → WIP Input Complete (all assets graded beyond "U"), WIP Input Complete → Ops Complete (all assets in recycle/finished locations), WIP → Exceptions-only (all units in recycle/finished/exception status). |
| FR-29 | The system shall support manual single-asset creation, capturing part number and all data required by that part number's category and the account's requirements. |
| FR-30 | The system shall support bulk asset ("Apto ID") creation using a generic/ungraded part number without requiring full field entry, for later completion via manual entry or auditing software. |
| FR-31 | The system shall support mass asset creation via file upload or from saved ASN data, pre-populating available fields (part number, serial number, client ID) under a selected Job. |
| FR-32 | The system shall support Parent/Child asset relationships (e.g., components removed from a parent asset). |
| FR-33 | The system shall support Bound/Unbound asset relationships, where a bound child asset inherits the parent's location and is reflected in Browse Inventory views. |
| FR-34 | The system shall warn/require verification when a user attempts to add assets to a Job whose Ops status is In Transit or Ops Complete. |
| FR-35 | The system shall allow users to search for and select an existing part number, or create a new part number, during asset creation. |
| FR-36 | The system shall prevent assets from reaching a sellable status until all category- and account-specific processing criteria are met. |
| FR-37 | The system shall provide a single-asset Edit page to view/update all asset attributes, bind/unbind the asset, with all changes logged (user, date, change). |
| FR-38 | The system shall provide a "Quick Scan" page allowing users to define and save reusable functions that batch-update selected attributes (Part Number, Grade/Condition, Location, Add/Remove Damage, Add/Remove Status) on multiple assets identified by Apto ID, serial number, or Cart/Pallet ID. |
| FR-39 | Privileged users shall be able to create global Quick Scan presets; standard users shall be able to create and save presets scoped to their own account. |
| FR-40 | The system shall provide an image-capture UI supporting up to 3 photos per Apto ID, with view/edit/delete/retake/download, accessible from Browse Inventory and Edit Asset views; capture may be mandatory based on account rules and grading condition. |
| FR-41 | The system shall allow privileged users to define warehouse Locations within a facility's preset Areas (e.g., Area → Lane/Rack/Bay → Cart), per a Facilities table (ID, address). |
| FR-42 | The system shall support Carts as mobile bins not bound to a fixed Area/Location. |
| FR-43 | The system shall provide Part Number Management to view, search, add, and edit part numbers, validated via API (category, estimated unit weight, manufacturer, attributes) to prevent duplicate part numbers/manufacturers. |
| FR-44 | Deleting a part number shall require the system to check for assigned assets and require selection of a replacement part number before deletion proceeds. |
| FR-45 | The system shall log all part number changes (change, date, user) with a filterable log view by part number or date range. |
| FR-46 | The system shall provide Manufacturer Management with AI-assisted duplicate detection (e.g., "HP" vs. "Hewlett Packard"). |
| FR-47 | The system shall provide a Browse Inventory page to search current and sold inventory by all available data points, with selectable result columns, bulk ID/serial/client-ID lookup via pasted lists, and export to Excel. |
| FR-47a | Browse Inventory shall support account-specific report runs, with results linking directly to asset change logs and Edit Asset pages, and sortable result columns. |
| FR-48 | Users shall be able to save and set default predefined search filters/columns in Browse Inventory. |
| FR-49 | Privileged users shall be able to add assets from Browse Inventory results directly into a cart for invoice or auction creation. |
| FR-50 | The system shall provide a Test Records page displaying category-driven test results per asset, sourced from system data entry or integrated auditing software. |
| FR-50a | Users shall be able to manually edit Test Records entries, with all edits captured in a change log. |
| FR-51 | The system shall provide a "Manual Data Reset Attestation" function generating a data-sanitization record capturing user, asset details, date/time, and an editable attestation statement. |
| FR-52 | The system shall provide Data Sanitization Record Management to download individual or bulk sanitization records/certificates, sourced from integrated software or manual entry. |
| FR-53 | The system shall allow users to build asset carts and convert them into one of: Auction, Recycle Invoice (Pull or Clear), Redeploy Shipment, or Sales Invoice — restricted to assets meeting the required status/eligibility. |
| FR-54 | The system shall integrate with the Bidlogix auction platform to create auction lots from a cart, using asset base prices to set reserve prices, and shall create a corresponding Order Fulfillment entry. |
| FR-55 | Successful Bidlogix auctions shall be automatically converted into full invoices with customer information attached. |
| FR-56a | The system shall support Sales Invoice creation with asset eligibility validation. |
| FR-56b | The system shall support Sales Invoice pricing by individual asset or by grouped attributes (part number, grade, damages). |
| FR-56c | The system shall support Sales Invoice shipping-arrangement options and packing-instruction options (Standard, IATA Compliant, HOLD, Special/free-text). |
| FR-56d | The system shall support Sales Invoice buyer selection or creation (billing/shipping addresses, contacts, terms, shipping account IDs), with address validation. |
| FR-56e | The system shall calculate Sales Invoice totals (pricing, fees, taxes). |
| FR-56f | The system shall provide an Asset Pricing Interface for market-value tracking, suggested sales/buy prices, and assigning base prices to inventory. |
| FR-57 | The system shall support two Recycle Invoice types: "Pull" (creates an Order Fulfillment entry) and "Clear" (assumed already removed, marked shipped immediately, no fulfillment entry). |
| FR-58 | The system shall provide Invoice Management for privileged users to search, view, and edit invoices (packing instructions, customer info, shipping approval), distinguishing edit rights for shipped vs. unshipped invoices, with a change-log view. |
| FR-58a | Invoice Management shall provide a default "unpaid" invoice view and support invoice-copy download. |
| FR-58b | The system shall provide Invoice Customer Management (CRUD, change logs, duplicate-customer detection). |
| FR-59 | The system shall provide an Invoice/Order Fulfillment workflow showing invoices by facility and status (awaiting approval, approved, auction), guiding Pull → Pack → Ship steps. |
| FR-60 | The Pull step shall let users scan asset IDs against the invoice's asset list with visual and audio confirmation; once complete, the invoice moves to "Packing." |
| FR-61 | The Packing step shall require a second full scan of all invoice assets, then prompt for shipment weight/dimensions, moving the invoice to "Staged," and email weights/dims when the buyer is arranging shipping. |
| FR-62 | Staged invoices shall be manually updatable to "Shipped," capturing tracking number and ship date, after which they are removed from the Order Fulfillment view. |
| FR-63 | The system shall support configurable Category-level processing requirements (e.g., data sanitization record, battery health check, reset log record) that gate an asset's sellable status. |
| FR-64 | The system shall integrate with Blancco to pull processed asset/hard-drive data via scheduled API calls, parse it, and update asset data-sanitization and part-number records; and shall receive inbound API updates from Blancco during processing (damages, location, client identifiers). |
| FR-65 | The system shall integrate with Phonecheck via a scheduled (5-minute interval) API pull for mobile-device processing data, parsed and applied to associated assets. |
| FR-66 | The system shall integrate with EPS (hard-drive sanitization/auditing software) via ODBC to a dedicated database, with stored procedures importing data into AIMS. |
| FR-67 | The system shall support a method for users to select inventory assets, determine target prices via internal pricing methodology, and push data to Bidlogix to create an auction (including images, reserve price, start/end dates). |
| FR-68 | The system shall sync client, customer, and sales information with QuickBooks, create non-inventory POs, and pass fee information to QuickBooks for client invoicing and remittance. |
| FR-69 | The system shall validate asset data entry against client ASNs and/or AI-assisted part-number verification (per BR-008). |
| FR-70 | The system shall monitor customer SLAs and provide visibility into approaching or missed deadlines (per BR-001). |
| FR-71 | The system shall support configurable business rules to triage incoming assets into resale, refurbishment, or recycling/disposition based on resale value, repair cost, condition, and customer requirements (per BR-002). |
| FR-72 | The system shall prevent release (resale/redeployment) of any data-bearing asset until required data sanitization/destruction has been completed and documented (per BR-003). |
| FR-73 | The system shall generate and retain documentation (Certificates of Recycling, Certificates of Destruction) demonstrating environmentally compliant processing (per BR-004). |
| FR-74 | The system shall enforce customer-specific processing instructions across the asset lifecycle (mandatory recycling, shredding, certified destruction, custom reporting, required approvals, redeployment, SLA obligations) (per BR-005). |
| FR-75 | The system shall track services performed, fees, processing costs, resale proceeds, and customer-specific pricing to support invoicing and profitability analysis (per BR-006). |
| FR-76 | The system shall calculate and track proceeds from resale of customer-owned (consignment) assets for transparent customer remittance (per BR-007). |
| FR-77 | The system shall maintain a complete, auditable chain of custody for every asset (custody transfers, warehouse movements, processing activities, final outcome) (per BR-009). |
| FR-78 | The system shall provide real-time visibility into the status and physical location of every asset (per BR-010). |
| FR-79 | The system shall provide comprehensive reporting/audit records covering inventory status, disposition, data destruction, financials, SLA performance, and chain of custody (per BR-012). |
| FR-80 | The system shall provide Dashboards for Production (output by company/warehouse/individual, run rate by category/account) and SLA (company/warehouse-wide tracking, upcoming deadlines, status breakdown, estimated asset value). |
| FR-81a | The system shall provide a secondary management view for Damages. |
| FR-81b | The system shall provide a secondary management view for Job Status. |
| FR-81c | The system shall provide a secondary management view for Category. |
| FR-81d | The system shall provide a secondary management view for Location. |
| FR-81e | The system shall provide a secondary management view for Asset Status. |
| FR-81f | The system shall provide a Part Number Translation view (mapping Blancco-identified part numbers that don't match existing records to an existing or new part number). |
| FR-82 | The Part Number Translation view shall apply the user's mapping decision to future assets with the same unmatched Blancco readout automatically. |

---

## Non-Functional Requirements

| ID | Category | Description |
|----|----------|--------------|
| NFR-1 | Scalability | The system shall use a scalable architecture capable of supporting future modules and additional third-party integrations. |
| NFR-2 | Scalability | The architecture shall accommodate future growth in SKU count, transaction volume, and additional warehouse/facility locations *(from RFP Q4.7)*. |
| NFR-3 | Security/Compliance | No data-bearing asset may be released until data sanitization/destruction is completed and documented (also BR-003/FR-72). |
| NFR-4 | Compliance | Environmental compliance documentation (Certificates of Recycling/Destruction) must be retained (also BR-004). |
| NFR-5 | Compliance | All asset processing must comply with applicable legal, environmental, security, and contractual obligations, with records demonstrating compliance (BR-011). |
| NFR-6 | Auditability | All create/edit actions on Accounts, Jobs, Assets, Part Numbers, and Invoices must be logged with user, timestamp, and change detail, and be viewable via in-app log views. |
| NFR-7 | Performance/Reliability | Integration polling with Phonecheck occurs on a fixed 5-minute interval; Blancco/EPS use scheduled pulls and stored-procedure jobs — implying a need for reliable, timely scheduled-job execution. `[inferred]` |
| NFR-8 | Usability | Dashboards must present visual/graphical summaries (charts) to make SLA and production data "more easily ingested." |
| NFR-9 | Data Quality | Account Codes and Part Numbers must be enforced unique; duplicate manufacturer/part-number entries must be prevented via validation. |
| NFR-10 | Security `[inferred]` | Role-based access control is required at a granular feature level (per FR-8), implying authorization checks must be enforced system-wide, not just UI-hidden. |
| NFR-11 | Data Residency/Backup `[inferred]` | Given financial, customer PII, and compliance-certificate data handled, backup/disaster-recovery and data-retention capabilities are expected even though not explicitly detailed. |
| NFR-12 | Maintainability `[inferred]` | Additional Quick Scan fields "may need to be added as business needs continue" and should be "manageable through a UI," implying a configuration-driven (not hard-coded) design for extensibility. |
| NFR-13 | Availability `[inferred]` | Multi-facility (GA, TX, CA), continuous warehouse operations imply a need for high availability of the core application during business hours across time zones. |

---

## Technical Constraints

| ID | Description |
|----|-------------|
| TC-1 | Primary backend database must be Microsoft SQL Server 2025. |
| TC-2 | User identity/directory must be Active Directory (on-premise) as the system of record for provisioning and password management, synchronized out to Google Workspace and Office 365. |
| TC-3 | The application itself must federate authentication (SSO) to Google Workspace as the identity broker — i.e., AIMS does not authenticate directly against on-prem AD; it relies on AD-synced Google Workspace credentials. |
| TC-4 | Must integrate with QuickBooks Enterprise for financial sync and invoicing. |
| TC-5 | Must integrate with Netchex (currently an optional add-on). |
| TC-6 | Must integrate with Bidlogix auction platform. |
| TC-7 | Must integrate with Blancco (two interfaces: scheduled API pull from Blancco cloud, and inbound API calls from Blancco during processing). |
| TC-8 | Must integrate with Phonecheck via API, polled on a 5-minute interval. |
| TC-9 | Must integrate with EPS via ODBC connection to a dedicated database on the Apto DB server, with stored procedures feeding AIMS. |
| TC-10 | Must integrate with Azure AI API (referenced under BR-014 integrations list), to support AI-assisted part-number/manufacturer validation and duplicate detection (see FR-43, FR-46, FR-69). |
| TC-11 | Data model entities are pre-scoped per `NewAIMsTableMatrix.pdf`, including Accounts, Jobs, Inventory, Part Number Master, Categories, Grades, Data Wipe Logs, Asset Damages, Manufacturer List, Test Records, Change Logs, Invoice Master/Customer/Shipping, Account Rules, HTS Category Translation, Customer Payment Terms, Invoice Packing Options, Jobs Rules Relation — constraining the logical schema design. |
| TC-12 | Must support data masking for non-production/development environments (RFP Q4.4). |
| TC-13 | Facilities are currently 3 known locations (GA, TX, CA), each with its own address and location/area hierarchy — the architecture must support additional facilities being added over time (see NFR-2), so this is a starting-state constraint, not a permanent limit. |

---

## Business Constraints

| ID | Description |
|----|-------------|
| BC-1 | This is a formal RFP process requiring written, line-item vendor responses before contract award; general/non-specific answers will count against the vendor's evaluation. |
| BC-2 | The original estimate was built from the current (legacy) WMS's feature set; the client is requiring confirmation of how requirements were (re-)validated and where assumptions were made, plus a requirements traceability matrix tying each feature to estimated hours. |
| BC-3 | The client requires an itemized, work-breakdown-structure estimate (discovery, design, development, QA, PM, UAT hours per major feature area) rather than lump-sum pricing per feature. |
| BC-4 | The client requires an explicit, written out-of-scope statement (e.g., integrations, mobile/RF scanning, reporting, EDI, label/barcode printing, multi-warehouse support). |
| BC-5 | The client requires disclosure of named team members, roles, seniority, and % allocation — not a generic team description. |
| BC-6 | The client requires defined working-hours overlap with Eastern Time business hours and defined PM/Scrum Master communication proficiency and availability. |
| BC-7 | The client requires a formal change-order process for mid-project scope changes, with impact on hours/timeline communicated. |
| BC-8 | A new Master Services Agreement (MSA) and Statement of Work (SOW) must be executed, with defined liability terms. |
| BC-9 | Contract must explicitly assign all IP (code, designs, documentation) to the client upon delivery/payment. |
| BC-10 | All team members with system/data access (not just account managers) must sign Apto NDAs. |
| BC-11 | The client requires disclosure of contingency buffer (%) and top 3 project risks with mitigations. |
| BC-12 | Engagement pricing model (fixed-price vs. time-and-materials, with/without not-to-exceed cap) must be explicitly proposed. |
| BC-13 | Post-launch warranty/bug-fix period and ongoing maintenance model (retainer/hourly/separate SOW) must be defined. |
| BC-14 | The client requires knowledge transfer/documentation sufficient for them to maintain or extend the system independently of the vendor. |
| BC-15 | The client requires 2–3 references and a comparable case study (scope, timeline, and budget vs. original estimate) specifically from WMS/logistics/supply-chain projects. |
| BC-16 | Governance cadence (burn-down/budget/risk reporting, milestone sign-off, overage notification process) must be defined and agreed before/at project start. |

---

## Extraction Notes

- **Assumptions:** "AIMS" is treated as the working name for the new ERP/WMS platform described in `Nexus Requirements.docx`; the PDF matrix and UI Views spreadsheet are treated as supporting detail for the same system described in that document, not a separate project.
- **Ambiguities:**
  - `Project RFP Questions.docx` is a vendor-qualification questionnaire (process/methodology/commercial questions) rather than a system requirement source; its content was captured as Business Constraints (contractual/process expectations) rather than FR/NFR, since no new system capabilities are described there.
  - `NewAIMsTableMatrix.pdf` text extraction lost its original diagram layout (likely a visual ER/table-relationship diagram); entities and keys were captured as a Technical Constraint on the data model rather than individual FRs, since relationships between boxes could not be reliably reconstructed from text alone.
  - The "Reporting Columns," "Conversion Tables," and "Settlement Pricing Tables" entities in the matrix PDF have unclear field-level detail (labeled "Item 2," "Item 3" as placeholders in the source) — these may require a follow-up discovery session to fully specify.
  - "Color Map," "Schema not defined," and "Undecided Relation or Use" entities on the matrix are explicitly marked undecided by the client — flagged for clarification before architecture/estimation work.
- **Possible gaps (not stated in source, flagged for follow-up):**
  - No explicit non-functional targets given for uptime/SLA %, response-time, or concurrent-user counts — these are typically needed for infrastructure sizing and were inferred only generically (NFR-13).
  - No explicit statement on data retention duration or backup/DR strategy despite compliance/audit emphasis (NFR-11 inferred).
  - RFP Q3 ("mobile/RF scanning") out-of-scope status is explicitly uncertain and must be clarified with the client, since Browse/Quick Scan features imply barcode/ID scanning UI exists, but the RFP lists "mobile/RF scanning" as a possible exclusion.

- **v2 output-audit corrections (this revision):**
  - **Added FR-7a, FR-47a, FR-50a, FR-56f, FR-58a, FR-58b** — found in `UI Views.xlsx` (Views List tab) during a re-audit of the original extraction: a user access-review/audit report, Browse Inventory account-specific report runs linking to logs/Edit Asset, Test Records manual edit+log, an Asset Pricing Interface (market-value tracking, suggested prices, base-price assignment), an Invoice Management default "unpaid" view + copy download, and Invoice Customer Management (CRUD/logs/dedup). These were present in the source spreadsheet but missed in the v1 extraction pass.
  - **Split FR-56 → FR-56a–f** and **FR-81 → FR-81a–f** for atomicity — both bundled multiple distinct capabilities into a single row, violating the requirements-extractor skill's one-capability-per-FR rule.
  - **Reworded FR-17** — v1 added "account names must remain synchronized between systems," which overstated the source (`Nexus Requirements.docx`, Account Creation and Management section only describes QuickBooks account creation triggered at AIMS account creation, not ongoing bi-directional name sync).
  - **Removed old NFR-3 and NFR-4** — both described functional capabilities (password sync, SSO) that are features, not quality attributes, and were already fully captured as FR-4 and FR-5 respectively. Remaining NFRs renumbered sequentially (old NFR-5…15 → NFR-3…13).
  - **Removed old TC-11** ("must support AI-assisted part-number/manufacturer validation") — this described a system capability (already captured as FR-43, FR-46, FR-69), not a pre-existing technical constraint. The genuine constraint (mandated use of Azure AI API) is retained as TC-10, now cross-referenced to those FRs. Remaining TCs renumbered (old TC-12…14 → TC-11…13).
  - **Reworded old TC-14** (now TC-13) — v1 stated facilities are "fixed" at 3 locations; source only states the *current* state (GA/TX/CA) while NFR-2 and RFP Q4.7 explicitly require the architecture to support additional facilities over time. Reworded to avoid contradicting NFR-2.
