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
