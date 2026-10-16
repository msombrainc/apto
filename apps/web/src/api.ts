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
  aptoId: string;
  jobId: string;
  partNumberId: string | null;
  partNumber: string | null;
  serialNumber: string | null;
  grade: string | null;
  status: string | null;
  locationId: string | null;
  locationName: string | null;
  createdAtUtc: string;
  changeLog: AssetChangeLogEntry[];
};

export type AssetLookupResult = {
  id: string;
  aptoId: string;
  serialNumber: string | null;
  jobId: string;
  facilityCode: string | null;
  grade: string | null;
  status: string | null;
  locationId: string | null;
  locationName: string | null;
  partNumber: string | null;
};

export type AssetInventoryRow = {
  id: string;
  aptoId: string;
  jobId: string;
  serialNumber: string | null;
  partNumber: string | null;
  grade: string | null;
  status: string | null;
  locationId: string | null;
  locationName: string | null;
  accountName: string;
  facilityCode: string | null;
  createdAtUtc: string;
};

export type AssetWrite = {
  partNumberId?: string | null;
  serialNumber?: string | null;
  newPartNumber?: string | null;
  grade?: string | null;
  status?: string | null;
  locationId?: string | null;
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

export async function lookupAssetByCode(code: string): Promise<AssetLookupResult> {
  const trimmed = code.trim();
  const res = await fetch(
    `${base}/api/assets/lookup?code=${encodeURIComponent(trimmed)}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `lookup failed: ${res.status}`);
  }
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

export type ReferenceItem = {
  id: string;
  type: string;
  code: string;
  name: string;
  parentId: string | null;
  parentCode: string | null;
  parentName: string | null;
  group: string | null;
  certificateGroup: string | null;
  sortOrder: number;
  isActive: boolean;
  inUseCount: number;
};

export type ReferenceListResult = {
  items: ReferenceItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type ReferenceWrite = {
  code: string;
  name: string;
  sortOrder: number;
  parentId?: string | null;
  group?: string | null;
  certificateGroup?: string | null;
  isActive?: boolean | null;
};

export type CategoryRow = {
  id: string;
  name: string;
  isActive: boolean;
  partNumberCount: number;
};

export type CategoryListResult = {
  items: CategoryRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type ReferenceListParams = {
  q?: string;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
  facilityId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listReferenceItems(
  type: string,
  params: ReferenceListParams = {},
): Promise<ReferenceListResult> {
  const qs = buildQuery({
    q: params.q,
    page: params.page,
    pageSize: params.pageSize,
    includeInactive: params.includeInactive ? "true" : undefined,
    facilityId: params.facilityId,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  });
  const res = await fetch(`${base}/api/reference/${type}${qs}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `reference list failed: ${res.status}`);
  }
  return res.json();
}

export async function createReferenceItem(
  type: string,
  body: ReferenceWrite,
): Promise<ReferenceItem> {
  const res = await fetch(`${base}/api/reference/${type}`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `create reference failed: ${res.status}`);
  }
  return res.json();
}

export async function updateReferenceItem(
  type: string,
  id: string,
  body: ReferenceWrite,
): Promise<ReferenceItem> {
  const res = await fetch(`${base}/api/reference/${type}/${id}`, {
    method: "PUT",
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `update reference failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteReferenceItem(
  type: string,
  id: string,
): Promise<ReferenceItem | null> {
  const res = await fetch(`${base}/api/reference/${type}/${id}`, {
    method: "DELETE",
    headers: apiHeaders(),
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `delete reference failed: ${res.status}`);
  }
  return res.json();
}

export async function listCategories(
  params: ReferenceListParams = {},
): Promise<CategoryListResult> {
  const qs = buildQuery({
    q: params.q,
    page: params.page,
    pageSize: params.pageSize,
    includeInactive: params.includeInactive ? "true" : undefined,
  });
  const res = await fetch(`${base}/api/categories${qs}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `categories list failed: ${res.status}`);
  }
  return res.json();
}

export async function createCategory(name: string): Promise<CategoryRow> {
  const res = await fetch(`${base}/api/categories`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `create category failed: ${res.status}`);
  }
  return res.json();
}

export async function updateCategory(
  id: string,
  name: string,
  isActive?: boolean,
): Promise<CategoryRow> {
  const res = await fetch(`${base}/api/categories/${id}`, {
    method: "PUT",
    headers: apiHeaders(),
    body: JSON.stringify({ name, isActive }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `update category failed: ${res.status}`);
  }
  return res.json();
}

export type QboStatus = {
  connected: boolean;
  companyName?: string | null;
  realmId?: string | null;
  connectUrl?: string;
};

export type QboRequestRow = {
  id: string;
  operation: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  status: string;
  attempts: number;
  lastError: string | null;
  qboId: string | null;
  createdAtUtc: string;
  sentAtUtc: string | null;
};

export type QboRequestListResult = {
  items: QboRequestRow[];
  page: number;
  pageSize: number;
  total: number;
};

export async function getQboStatus(): Promise<QboStatus> {
  const res = await fetch(`${base}/api/qbo/status`);
  if (!res.ok) throw new Error(`qbo status failed: ${res.status}`);
  return res.json();
}

export async function listQboRequests(
  params: {
    status?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<QboRequestListResult> {
  const qs = buildQuery({
    status: params.status,
    type: params.type,
    page: params.page,
    pageSize: params.pageSize,
  });
  const res = await fetch(`${base}/api/qbo/requests${qs}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `qbo requests failed: ${res.status}`);
  }
  return res.json();
}

export async function retryQboRequest(id: string): Promise<void> {
  const res = await fetch(`${base}/api/qbo/requests/${id}/retry`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `qbo retry failed: ${res.status}`);
  }
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
