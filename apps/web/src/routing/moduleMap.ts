import { ROUTES } from "./paths";

export type ModuleAvailability = "d2" | "prototype" | "future";

export type ModuleEntry = {
  id: string;
  group: string;
  label: string;
  availability: ModuleAvailability;
  phaseTag?: string;
  path?: string;
};

/** Full AIMS module map — Demo2-Plan §F1 (static config). */
export const AIMS_MODULE_MAP: ModuleEntry[] = [
  // Operations
  { id: "jobs", group: "Operations", label: "Jobs", availability: "d2", path: ROUTES.jobs },
  {
    id: "sla-dashboard",
    group: "Operations",
    label: "SLA Dashboard",
    availability: "d2",
    phaseTag: "Demo 2",
    path: ROUTES.jobs,
  },
  { id: "quick-scan", group: "Operations", label: "Quick Scan", availability: "d2", path: ROUTES.scan },
  {
    id: "asset-import",
    group: "Operations",
    label: "Asset Import",
    availability: "future",
    phaseTag: "Demo 2 — import (F6)",
  },
  {
    id: "asn",
    group: "Operations",
    label: "ASN Page",
    availability: "future",
    phaseTag: "Phase 2",
  },
  {
    id: "order-fulfillment",
    group: "Operations",
    label: "Order Fulfillment",
    availability: "prototype",
    phaseTag: "Prototype / Phase 5",
  },
  // Inventory
  {
    id: "browse-inventory",
    group: "Inventory",
    label: "Browse Inventory",
    availability: "d2",
    path: ROUTES.inventory,
  },
  {
    id: "asset-detail",
    group: "Inventory",
    label: "Asset detail",
    availability: "d2",
    path: ROUTES.inventory,
  },
  {
    id: "test-records",
    group: "Inventory",
    label: "Test Records",
    availability: "future",
    phaseTag: "Phase 4",
  },
  {
    id: "wipe-logs",
    group: "Inventory",
    label: "Wipe Logs & Certificates",
    availability: "future",
    phaseTag: "Phase 4 (Certificates D2)",
  },
  {
    id: "asset-images",
    group: "Inventory",
    label: "Asset Images",
    availability: "prototype",
    phaseTag: "Prototype / Phase 3",
  },
  // Accounts & Sales
  { id: "accounts", group: "Accounts & Sales", label: "Accounts", availability: "d2", path: ROUTES.accounts },
  {
    id: "invoices",
    group: "Accounts & Sales",
    label: "Invoices",
    availability: "future",
    phaseTag: "Phase 5 — Sales, Auctions, Invoicing & Fulfillment",
  },
  {
    id: "invoice-customers",
    group: "Accounts & Sales",
    label: "Invoice Customers",
    availability: "future",
    phaseTag: "Phase 5",
  },
  {
    id: "asset-pricing",
    group: "Accounts & Sales",
    label: "Asset Pricing",
    availability: "future",
    phaseTag: "Phase 5",
  },
  {
    id: "ppc",
    group: "Accounts & Sales",
    label: "Purchase Price Calculator",
    availability: "future",
    phaseTag: "Phase 2",
  },
  // Admin
  {
    id: "reference-data",
    group: "Admin",
    label: "Reference Data",
    availability: "d2",
    path: ROUTES.referenceData,
  },
  {
    id: "part-numbers",
    group: "Admin",
    label: "Part Numbers",
    availability: "d2",
    path: ROUTES.partNumbers,
  },
  {
    id: "manufacturers",
    group: "Admin",
    label: "Manufacturers",
    availability: "future",
    phaseTag: "Phase 3",
  },
  {
    id: "pn-translation",
    group: "Admin",
    label: "Part Number Translation",
    availability: "future",
    phaseTag: "Phase 4",
  },
  {
    id: "user-mgmt",
    group: "Admin",
    label: "User Management",
    availability: "prototype",
    phaseTag: "Prototype / Phase 1",
  },
  { id: "qbo-sync", group: "Admin", label: "QuickBooks Sync", availability: "d2", path: ROUTES.qboSync },
  // Dashboards
  {
    id: "sla-dash",
    group: "Dashboards",
    label: "SLA",
    availability: "d2",
    path: ROUTES.jobs,
  },
  {
    id: "production",
    group: "Dashboards",
    label: "Production",
    availability: "prototype",
    phaseTag: "Prototype / Phase 6",
  },
];

export function moduleGroups(): { group: string; entries: ModuleEntry[] }[] {
  const order = ["Operations", "Inventory", "Accounts & Sales", "Admin", "Dashboards"];
  return order.map((group) => ({
    group,
    entries: AIMS_MODULE_MAP.filter((e) => e.group === group),
  }));
}

export type AppView =
  | "accounts"
  | "jobs"
  | "inventory"
  | "scan"
  | "reference-data"
  | "part-numbers"
  | "qbo-sync";

export function viewFromPathname(pathname: string): AppView {
  if (pathname.startsWith("/admin/reference-data")) return "reference-data";
  if (pathname.startsWith("/admin/part-numbers")) return "part-numbers";
  if (pathname.startsWith("/admin/qbo-sync")) return "qbo-sync";
  if (pathname.startsWith("/operations/scan")) return "scan";
  if (pathname.startsWith("/inventory")) return "inventory";
  if (pathname.startsWith("/jobs")) return "jobs";
  if (pathname.startsWith("/accounts")) return "accounts";
  return "accounts";
}

export function parseInventoryAssetId(pathname: string): string | null {
  const match = /^\/inventory\/assets\/([^/]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

export function parseAccountId(pathname: string): string | null {
  const match = /^\/accounts\/([^/]+)/.exec(pathname);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  return id === "" ? null : id;
}

export function parseJobId(pathname: string): string | null {
  const match = /^\/jobs\/([^/]+)/.exec(pathname);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  return id === "" ? null : id;
}

export function parseJobSpreadsheetImport(pathname: string): string | null {
  const match = /^\/jobs\/([^/]+)\/import\/spreadsheet\/?$/.exec(pathname);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  return id === "" ? null : id;
}

export function isKnownAppPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  return (
    pathname.startsWith("/accounts")
    || pathname.startsWith("/jobs")
    || pathname.startsWith("/inventory")
    || pathname.startsWith("/operations/scan")
    || pathname.startsWith("/admin/reference-data")
    || pathname.startsWith("/admin/part-numbers")
    || pathname.startsWith("/admin/qbo-sync")
  );
}
