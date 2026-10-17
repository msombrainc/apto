import { DEMO_USER } from "./demoAuth";

export type AccountBillingAddress = {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type AccountFees = {
  audit?: number | null;
  wipe?: number | null;
  shred?: number | null;
  recycle?: number | null;
  bulk?: number | null;
  bulkRecycle?: number | null;
  storage?: number | null;
  teardown?: number | null;
  repair?: number | null;
  osInstall?: number | null;
  redeploy?: number | null;
};

export type AccountRules = {
  requireProcessingApproval: boolean;
  requireRecycleApproval: boolean;
  requireSalesApproval: boolean;
  redeployOnly: boolean;
  redeployBypass: boolean;
  shredAllDrives: boolean;
  recycleOnly: boolean;
  requireShredPictures: boolean;
  requireDamagePictures: boolean;
};

export type AccountServices = {
  osInstallImaging: boolean;
  memoryInstall: boolean;
  partsReplacement: boolean;
};

export type AccountSettings = {
  aptoPercentage: number;
  fees: AccountFees;
  rules: AccountRules;
  services: AccountServices;
  billingAddress: AccountBillingAddress;
};

export type Account = {
  id: string;
  name: string;
  code: string;
  status: string;
  slaReceivingDays: number;
  slaProcessingDays: number;
  slaShippingDays: number;
  settings: AccountSettings;
  createdAtUtc: string;
  qboCustomerId?: string | null;
  qboSyncStatus?: string;
  qboSyncError?: string | null;
  qboLastSyncAtUtc?: string | null;
};

export type AccountWrite = {
  name: string;
  code: string;
  slaReceivingDays: number;
  slaProcessingDays: number;
  slaShippingDays: number;
  status?: string;
  settings?: AccountSettings;
};

export type AccountChangeLogEntry = {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAtUtc: string;
};

export type AccountChangeLogList = {
  items: AccountChangeLogEntry[];
  page: number;
  pageSize: number;
  total: number;
};

export function defaultAccountSettings(): AccountSettings {
  return {
    aptoPercentage: 0,
    fees: {},
    rules: {
      requireProcessingApproval: false,
      requireRecycleApproval: false,
      requireSalesApproval: false,
      redeployOnly: false,
      redeployBypass: false,
      shredAllDrives: false,
      recycleOnly: false,
      requireShredPictures: false,
      requireDamagePictures: false,
    },
    services: {
      osInstallImaging: false,
      memoryInstall: false,
      partsReplacement: false,
    },
    billingAddress: {
      line1: "",
      line2: null,
      city: "",
      state: "",
      postalCode: "",
      country: "US",
    },
  };
}

const base = "";

export async function listAccounts(
  q?: string,
  status: "Active" | "Inactive" | "Both" = "Active",
): Promise<Account[]> {
  const qs = buildQuery({
    q: q?.trim() || undefined,
    status,
  });
  const res = await fetch(`${base}/api/accounts${qs}`);
  if (!res.ok) throw new Error(`list failed: ${res.status}`);
  return res.json();
}

export async function getAccount(id: string): Promise<Account> {
  const res = await fetch(`${base}/api/accounts/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`get account failed: ${res.status}`);
  return res.json();
}

export async function updateAccount(id: string, body: AccountWrite): Promise<Account> {
  const res = await fetch(`${base}/api/accounts/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `update account failed: ${res.status}`);
  }
  return res.json();
}

export async function listAccountChanges(
  accountId: string,
  params: {
    field?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<AccountChangeLogList> {
  const qs = buildQuery({
    field: params.field,
    from: params.from,
    to: params.to,
    page: params.page,
    pageSize: params.pageSize,
  });
  const res = await fetch(
    `${base}/api/accounts/${encodeURIComponent(accountId)}/changes${qs}`,
  );
  if (!res.ok) throw new Error(`account changes failed: ${res.status}`);
  return res.json();
}

export async function postAccountQboSync(accountId: string): Promise<{ requestId: string }> {
  const res = await fetch(`${base}/api/accounts/${encodeURIComponent(accountId)}/qbo-sync`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `qbo sync failed: ${res.status}`);
  }
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
  accountCode: string;
  facilityCode: string | null;
  opsStatus: string | null;
  startDateUtc: string | null;
  dueDateUtc: string | null;
  slaTotalDays: number;
  daysRemaining: number;
  slaStatus: "on-track" | "at-risk" | "overdue";
  createdAtUtc: string;
  daysSinceStart: number;
  wipAssetCount: number;
  exceptionAssetCount: number;
  finishedAssetCount: number;
  progressPercent: number;
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

export async function getJob(id: string): Promise<Job> {
  const res = await fetch(`${base}/api/jobs/${encodeURIComponent(id)}`);
  if (res.status === 404) throw new Error("job not found");
  if (!res.ok) throw new Error(`get job failed: ${res.status}`);
  return res.json();
}

export async function updateJob(id: string, body: JobWrite): Promise<Job> {
  const res = await fetch(`${base}/api/jobs/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `update job failed: ${res.status}`);
  }
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
  category: string | null;
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
  categoryName: string | null;
  grade: string | null;
  status: string | null;
  locationId: string | null;
  locationName: string | null;
  accountName: string;
  facilityCode: string | null;
  createdAtUtc: string;
};

export type AssetInventoryListResult = {
  items: AssetInventoryRow[];
  page: number;
  pageSize: number;
  total: number;
  notFoundCodes?: string[] | null;
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
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export type PartNumberRow = {
  id: string;
  number: string;
  categoryId: string | null;
  categoryName: string | null;
  assetCount: number;
};

export type PartNumberListResult = {
  items: PartNumberRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type PartNumberListParams = {
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "number" | "categoryName" | "assetCount";
  sortDir?: "asc" | "desc";
};

export async function listPartNumbers(
  params: PartNumberListParams = {},
): Promise<PartNumberListResult> {
  const qs = buildQuery({
    q: params.q,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  });
  const res = await fetch(`${base}/api/part-numbers${qs}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `part numbers list failed: ${res.status}`);
  }
  return res.json();
}

export async function createPartNumberAdmin(
  number: string,
  categoryId: string | null,
): Promise<PartNumberRow> {
  const res = await fetch(`${base}/api/part-numbers`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ number, categoryId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `create part number failed: ${res.status}`);
  }
  const created = await res.json();
  return {
    id: created.id,
    number: created.number,
    categoryId: created.categoryId ?? null,
    categoryName: created.categoryName ?? null,
    assetCount: 0,
  };
}

export async function updatePartNumberAdmin(
  id: string,
  number: string,
  categoryId: string | null,
): Promise<PartNumberRow> {
  const res = await fetch(`${base}/api/part-numbers/${id}`, {
    method: "PUT",
    headers: apiHeaders(),
    body: JSON.stringify({ number, categoryId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `update part number failed: ${res.status}`);
  }
  return res.json();
}

export async function deletePartNumberAdmin(
  id: string,
  replacementId?: string | null,
): Promise<void> {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  const res = await fetch(`${base}/api/part-numbers/${id}${qs}`, {
    method: "DELETE",
    headers: apiHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `delete part number failed: ${res.status}`);
  }
}

export type InventoryQuery = {
  q?: string;
  accountId?: string;
  facilityCode?: string;
  jobId?: string;
  grade?: string;
  status?: string;
  locationId?: string;
  category?: string;
  createdFrom?: string;
  createdTo?: string;
  codes?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export async function listInventoryAssets(
  params: InventoryQuery = {},
): Promise<AssetInventoryRow[]> {
  const result = await listInventoryAssetsPaged({ ...params, page: 1, pageSize: 200 });
  return result.items;
}

export async function listInventoryAssetsPaged(
  params: InventoryQuery = {},
): Promise<AssetInventoryListResult> {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.accountId) search.set("accountId", params.accountId);
  if (params.facilityCode?.trim()) search.set("facilityCode", params.facilityCode.trim());
  if (params.jobId) search.set("jobId", params.jobId);
  if (params.grade?.trim()) search.set("grade", params.grade.trim());
  if (params.status?.trim()) search.set("status", params.status.trim());
  if (params.locationId) search.set("locationId", params.locationId);
  if (params.category?.trim()) search.set("category", params.category.trim());
  if (params.createdFrom) search.set("createdFrom", params.createdFrom);
  if (params.createdTo) search.set("createdTo", params.createdTo);
  if (params.codes?.trim()) search.set("codes", params.codes.trim());
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 50));
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortDir) search.set("sortDir", params.sortDir);
  const qs = search.toString();
  const res = await fetch(`${base}/api/assets?${qs}`);
  if (!res.ok) throw new Error(`inventory list failed: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) {
    return {
      items: data,
      page: 1,
      pageSize: data.length,
      total: data.length,
    };
  }
  return {
    items: data.items ?? [],
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 50,
    total: data.total ?? 0,
    notFoundCodes: data.notFoundCodes ?? null,
  };
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

export type InvoicePreviewLine = {
  serviceKey: string;
  label: string;
  unitRate: number;
  defaultQuantity: number;
  quantityHint: string;
  lineTotal: number;
};

export type JobInvoicePreview = {
  jobId: string;
  accountId: string;
  accountName: string;
  qboCustomerId: string | null;
  lines: InvoicePreviewLine[];
};

export type ServiceInvoiceRow = {
  id: string;
  status: string;
  total: number;
  note: string | null;
  qboDocNumber: string | null;
  qboInvoiceId: string | null;
  lastError: string | null;
  createdAtUtc: string;
};

export async function getJobInvoicePreview(jobId: string): Promise<JobInvoicePreview> {
  const res = await fetch(`${base}/api/jobs/${encodeURIComponent(jobId)}/invoice-preview`);
  if (!res.ok) throw new Error(`invoice preview failed: ${res.status}`);
  return res.json();
}

export async function listJobInvoices(jobId: string): Promise<ServiceInvoiceRow[]> {
  const res = await fetch(`${base}/api/jobs/${encodeURIComponent(jobId)}/invoices`);
  if (!res.ok) throw new Error(`list invoices failed: ${res.status}`);
  return res.json();
}

export async function createJobInvoice(
  jobId: string,
  body: { note?: string; lines: { serviceKey: string; quantity: number }[] },
): Promise<{ id: string; status: string }> {
  const res = await fetch(`${base}/api/jobs/${encodeURIComponent(jobId)}/invoices`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `create invoice failed: ${res.status}`);
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
