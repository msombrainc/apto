export type F15User = {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Inactive";
};

export type F15PermissionFeature =
  | "Accounts"
  | "Jobs"
  | "Part numbers"
  | "Invoices"
  | "Inventory"
  | "Reference data"
  | "User admin";

export type F15UserPermissions = Record<F15PermissionFeature, boolean>;

export type F15AccessHistoryRow = {
  id: string;
  userName: string;
  changedBy: string;
  feature: F15PermissionFeature;
  change: "Granted" | "Revoked";
  atUtc: string;
};

export const F15_PERMISSION_FEATURES: F15PermissionFeature[] = [
  "Accounts",
  "Jobs",
  "Part numbers",
  "Invoices",
  "Inventory",
  "Reference data",
  "User admin",
];

export const F15_USERS: F15User[] = [
  { id: "u1", name: "Demo Operator", email: "demo@apto.local", status: "Active" },
  { id: "u2", name: "Jordan Lee", email: "jordan.lee@apto.local", status: "Active" },
  { id: "u3", name: "Morgan Chen", email: "morgan.chen@apto.local", status: "Active" },
  { id: "u4", name: "Sam Rivera", email: "sam.rivera@apto.local", status: "Inactive" },
];

export const F15_DEFAULT_PERMISSIONS: Record<string, F15UserPermissions> = {
  u1: {
    Accounts: true,
    Jobs: true,
    "Part numbers": true,
    Invoices: true,
    Inventory: true,
    "Reference data": true,
    "User admin": true,
  },
  u2: {
    Accounts: true,
    Jobs: true,
    "Part numbers": false,
    Invoices: false,
    Inventory: true,
    "Reference data": false,
    "User admin": false,
  },
  u3: {
    Accounts: false,
    Jobs: true,
    "Part numbers": true,
    Invoices: false,
    Inventory: true,
    "Reference data": true,
    "User admin": false,
  },
  u4: {
    Accounts: false,
    Jobs: false,
    "Part numbers": false,
    Invoices: false,
    Inventory: false,
    "Reference data": false,
    "User admin": false,
  },
};

export const F15_ACCESS_HISTORY: F15AccessHistoryRow[] = [
  {
    id: "h1",
    userName: "Jordan Lee",
    changedBy: "Demo Operator",
    feature: "Invoices",
    change: "Granted",
    atUtc: "2026-03-10T14:22:00Z",
  },
  {
    id: "h2",
    userName: "Morgan Chen",
    changedBy: "Demo Operator",
    feature: "User admin",
    change: "Revoked",
    atUtc: "2026-03-08T09:05:00Z",
  },
  {
    id: "h3",
    userName: "Sam Rivera",
    changedBy: "Demo Operator",
    feature: "Jobs",
    change: "Revoked",
    atUtc: "2026-02-28T16:40:00Z",
  },
];

export type F15InvoiceLine = {
  aptoId: string;
  description: string;
};

export type F15UnshippedInvoice = {
  id: string;
  number: string;
  facility: string;
  accountName: string;
  lines: F15InvoiceLine[];
};

export const F15_UNSHIPPED_INVOICES: F15UnshippedInvoice[] = [
  {
    id: "inv-1001",
    number: "INV-1001",
    facility: "GA",
    accountName: "Northwind Recycling",
    lines: [
      { aptoId: "APT-GA-00421", description: "Dell Latitude 7420" },
      { aptoId: "APT-GA-00422", description: "HP EliteBook 840" },
      { aptoId: "APT-GA-00423", description: "Lenovo T14 Gen 2" },
    ],
  },
  {
    id: "inv-1002",
    number: "INV-1002",
    facility: "TX",
    accountName: "Summit ITAD",
    lines: [
      { aptoId: "APT-TX-01102", description: "MacBook Pro 14\"" },
      { aptoId: "APT-TX-01103", description: "iPad Air (Wi-Fi)" },
    ],
  },
];

export type F15ProductionPeriod = "7d" | "30d" | "90d";

export type F15ProductionUserRow = {
  userName: string;
  unitsProcessed: number;
  categories: Record<string, number>;
};

export const F15_PRODUCTION_BY_FACILITY: Record<
  string,
  { users: F15ProductionUserRow[]; runRatePerDay: number }
> = {
  GA: {
    runRatePerDay: 142,
    users: [
      {
        userName: "Jordan Lee",
        unitsProcessed: 318,
        categories: { Laptop: 210, Desktop: 68, Tablet: 40 },
      },
      {
        userName: "Morgan Chen",
        unitsProcessed: 276,
        categories: { Laptop: 180, Server: 52, Other: 44 },
      },
    ],
  },
  TX: {
    runRatePerDay: 118,
    users: [
      {
        userName: "Demo Operator",
        unitsProcessed: 245,
        categories: { Laptop: 160, Phone: 85 },
      },
    ],
  },
  CA: {
    runRatePerDay: 96,
    users: [
      {
        userName: "Sam Rivera",
        unitsProcessed: 188,
        categories: { Desktop: 120, Laptop: 68 },
      },
    ],
  },
};

export type F15SampleAsset = {
  aptoId: string;
  serial: string;
  partNumber: string;
  accountName: string;
};

export const F15_SAMPLE_ASSETS: F15SampleAsset[] = [
  {
    aptoId: "APT-GA-00421",
    serial: "DL7420-9XK2",
    partNumber: "DELL-LAT-7420",
    accountName: "Northwind Recycling",
  },
  {
    aptoId: "APT-TX-01102",
    serial: "MBP14-C4V9",
    partNumber: "APPLE-MBP14-M2",
    accountName: "Summit ITAD",
  },
  {
    aptoId: "APT-CA-00777",
    serial: "HP840-Z1M3",
    partNumber: "HP-ELITE-840-G9",
    accountName: "Coastal Renewables",
  },
];
