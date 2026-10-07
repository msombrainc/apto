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
