import { DEMO_USER } from "./demoAuth";

export type Account = {
  id: string;
  name: string;
  code: string;
  slaReceivingDays: number;
  slaProcessingDays: number;
  slaShippingDays: number;
  createdAtUtc: string;
};

export type AccountWrite = {
  name: string;
  code: string;
  slaReceivingDays: number;
  slaProcessingDays: number;
  slaShippingDays: number;
};

const base = "";

export async function listAccounts(q?: string): Promise<Account[]> {
  const url = q?.trim()
    ? `${base}/api/accounts?q=${encodeURIComponent(q.trim())}`
    : `${base}/api/accounts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`list failed: ${res.status}`);
  return res.json();
}

export async function createAccount(body: AccountWrite): Promise<Account> {
  const res = await fetch(`${base}/api/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `create failed: ${res.status}`);
  }
  return res.json();
}

export type Job = {
  id: string;
  accountId: string;
  accountName: string;
  facilityCode: string | null;
  opsStatus: string | null;
  startDateUtc: string | null;
  dueDateUtc: string | null;
  slaTotalDays: number;
  daysRemaining: number;
  slaStatus: "on-track" | "at-risk" | "overdue";
  createdAtUtc: string;
};

export type JobWrite = {
  accountId: string;
  facilityCode?: string;
  opsStatus?: string;
  startDateUtc: string;
  dueDateUtc?: string | null;
};

export async function listJobs(accountId?: string): Promise<Job[]> {
  const url = accountId
    ? `${base}/api/jobs?accountId=${encodeURIComponent(accountId)}`
    : `${base}/api/jobs`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`list jobs failed: ${res.status}`);
  return res.json();
}

export async function listFacilities(): Promise<string[]> {
  const res = await fetch(`${base}/api/jobs/facilities`);
  if (!res.ok) throw new Error(`facilities failed: ${res.status}`);
  return res.json();
}

export async function createJob(body: JobWrite): Promise<Job> {
  const res = await fetch(`${base}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `create job failed: ${res.status}`);
  }
  return res.json();
}

export type PartNumber = {
  id: string;
  number: string;
  categoryName: string | null;
};

export type AssetChangeLogEntry = {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAtUtc: string;
};

export type Asset = {
  id: string;
  jobId: string;
  partNumberId: string | null;
  partNumber: string | null;
  serialNumber: string | null;
  createdAtUtc: string;
  changeLog: AssetChangeLogEntry[];
};

export type AssetInventoryRow = {
  id: string;
  jobId: string;
  serialNumber: string | null;
  partNumber: string | null;
  accountName: string;
  facilityCode: string | null;
  createdAtUtc: string;
};

export type AssetWrite = {
  partNumberId?: string | null;
  serialNumber?: string | null;
  newPartNumber?: string | null;
};

function apiHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Apto-User": DEMO_USER,
  };
}

export async function searchPartNumbers(q: string): Promise<PartNumber[]> {
  const url = q.trim()
    ? `${base}/api/part-numbers?q=${encodeURIComponent(q.trim())}`
    : `${base}/api/part-numbers`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`part number search failed: ${res.status}`);
  return res.json();
}

export type InventoryQuery = {
  q?: string;
  accountId?: string;
  facilityCode?: string;
  jobId?: string;
};

export async function listInventoryAssets(
  params: InventoryQuery = {},
): Promise<AssetInventoryRow[]> {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.accountId) search.set("accountId", params.accountId);
  if (params.facilityCode?.trim()) search.set("facilityCode", params.facilityCode.trim());
  if (params.jobId) search.set("jobId", params.jobId);
  const qs = search.toString();
  const res = await fetch(`${base}/api/assets${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`inventory list failed: ${res.status}`);
  return res.json();
}

export async function listJobAssets(jobId: string): Promise<Asset[]> {
  const res = await fetch(`${base}/api/jobs/${jobId}/assets`);
  if (!res.ok) throw new Error(`list assets failed: ${res.status}`);
  return res.json();
}

export async function getAsset(id: string): Promise<Asset> {
  const res = await fetch(`${base}/api/assets/${id}`);
  if (!res.ok) throw new Error(`get asset failed: ${res.status}`);
  return res.json();
}

export async function createJobAsset(jobId: string, body: AssetWrite): Promise<Asset> {
  const res = await fetch(`${base}/api/jobs/${jobId}/assets`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `create asset failed: ${res.status}`);
  }
  return res.json();
}

export async function updateAsset(id: string, body: AssetWrite): Promise<Asset> {
  const res = await fetch(`${base}/api/assets/${id}`, {
    method: "PUT",
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `update asset failed: ${res.status}`);
  }
  return res.json();
}
