import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Account,
  AccountChangeLogEntry,
  AccountSettings,
  AccountWrite,
  defaultAccountSettings,
  getAccount,
  listAccountChanges,
  listJobs,
  postAccountQboSync,
  updateAccount,
  type Job,
} from "../../api";
import { ROUTES } from "../../routing/paths";
import { AlertBanner } from "./AlertBanner";
import { AccountAvatar } from "./AccountAvatar";
import { AimsButton } from "./Button";
import { CodePill } from "./CodePill";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";

type AccountDetailPageProps = {
  accountId: string;
};

type TabId = "fees" | "rules" | "services" | "billing" | "history" | "jobs" | "qbo";

const TABS: { id: TabId; label: string }[] = [
  { id: "fees", label: "Fees" },
  { id: "rules", label: "Rules" },
  { id: "services", label: "Services" },
  { id: "billing", label: "Billing" },
  { id: "history", label: "History" },
  { id: "jobs", label: "Jobs" },
  { id: "qbo", label: "QuickBooks" },
];

const FEE_ROWS: { key: keyof AccountSettings["fees"]; label: string }[] = [
  { key: "audit", label: "Audit" },
  { key: "wipe", label: "Wipe" },
  { key: "shred", label: "Shred" },
  { key: "recycle", label: "Recycle" },
  { key: "bulk", label: "Bulk" },
  { key: "bulkRecycle", label: "Bulk recycle" },
  { key: "storage", label: "Storage" },
  { key: "teardown", label: "Teardown" },
  { key: "repair", label: "Repair" },
  { key: "osInstall", label: "OS install" },
  { key: "redeploy", label: "Redeploy" },
];

const RULE_ROWS: { key: keyof AccountSettings["rules"]; label: string }[] = [
  { key: "requireProcessingApproval", label: "Require processing approval" },
  { key: "requireRecycleApproval", label: "Require recycle approval" },
  { key: "requireSalesApproval", label: "Require sales approval" },
  { key: "redeployOnly", label: "Redeploy only" },
  { key: "redeployBypass", label: "Redeploy bypass" },
  { key: "shredAllDrives", label: "Shred all drives" },
  { key: "recycleOnly", label: "Recycle only" },
  { key: "requireShredPictures", label: "Require shred pictures" },
  { key: "requireDamagePictures", label: "Require damage pictures" },
];

const SERVICE_ROWS: { key: keyof AccountSettings["services"]; label: string }[] = [
  { key: "osInstallImaging", label: "OS install / imaging" },
  { key: "memoryInstall", label: "Memory install" },
  { key: "partsReplacement", label: "Parts replacement" },
];

function accountToWrite(account: Account): AccountWrite {
  return {
    name: account.name,
    code: account.code,
    status: account.status,
    slaReceivingDays: account.slaReceivingDays,
    slaProcessingDays: account.slaProcessingDays,
    slaShippingDays: account.slaShippingDays,
    settings: account.settings,
  };
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function qboPillClass(status: string | undefined): string {
  switch (status) {
    case "pending":
      return "status-pill status-pill--pending";
    case "sent":
      return "status-pill status-pill--active";
    case "failed":
      return "status-pill status-pill--failed";
    default:
      return "status-pill";
  }
}

function slaPillClass(status: Job["slaStatus"]): string {
  if (status === "overdue") return "status-pill status-pill--failed";
  if (status === "at-risk") return "status-pill status-pill--pending";
  return "status-pill status-pill--active";
}

export function AccountDetailPage({ accountId }: AccountDetailPageProps) {
  const [loaded, setLoaded] = useState<Account | null>(null);
  const [draft, setDraft] = useState<AccountWrite | null>(null);
  const [tab, setTab] = useState<TabId>("fees");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [changes, setChanges] = useState<AccountChangeLogEntry[]>([]);
  const [changesPage, setChangesPage] = useState(1);
  const [changesTotal, setChangesTotal] = useState(0);
  const [changeField, setChangeField] = useState("");
  const [changeFrom, setChangeFrom] = useState("");
  const [changeTo, setChangeTo] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const changesPageSize = 25;

  const dirty = useMemo(() => {
    if (!loaded || !draft) return false;
    return JSON.stringify(accountToWrite(loaded)) !== JSON.stringify(draft);
  }, [loaded, draft]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const account = await getAccount(accountId);
      setLoaded(account);
      setDraft(accountToWrite(account));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load account");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const reloadChanges = useCallback(async () => {
    try {
      const res = await listAccountChanges(accountId, {
        field: changeField || undefined,
        from: changeFrom ? `${changeFrom}T00:00:00Z` : undefined,
        to: changeTo ? `${changeTo}T23:59:59Z` : undefined,
        page: changesPage,
        pageSize: changesPageSize,
      });
      setChanges(res.items);
      setChangesTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load change history");
    }
  }, [accountId, changeField, changeFrom, changeTo, changesPage]);

  const reloadJobs = useCallback(async () => {
    try {
      setJobs(await listJobs(accountId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    }
  }, [accountId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (tab === "history") void reloadChanges();
  }, [tab, reloadChanges]);

  useEffect(() => {
    if (tab === "jobs") void reloadJobs();
  }, [tab, reloadJobs]);

  function updateDraft(patch: Partial<AccountWrite>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }

  function updateSettings(patch: Partial<AccountSettings>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            settings: { ...(d.settings ?? defaultAccountSettings()), ...patch },
          }
        : d,
    );
  }

  async function onSave(e?: FormEvent) {
    e?.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const updated = await updateAccount(accountId, draft);
      setLoaded(updated);
      setDraft(accountToWrite(updated));
      setSaveMessage("Account saved");
      if (tab === "history") void reloadChanges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function onRevert() {
    if (loaded) setDraft(accountToWrite(loaded));
  }

  async function onQboSync() {
    setError(null);
    try {
      await postAccountQboSync(accountId);
      setSaveMessage("Sync queued");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    }
  }

  if (loading && !loaded) {
    return <p className="muted">Loading account…</p>;
  }

  if (!loaded || !draft) {
    if (error) {
      return (
        <div className="dashboard-stack">
          <Link to={ROUTES.accounts} className="text-button">← Accounts</Link>
          <AlertBanner message={error} />
        </div>
      );
    }
    return <EmptyState title="Account not found" message="This account may have been removed." />;
  }

  const settings = draft.settings ?? defaultAccountSettings();

  return (
    <div className="dashboard-stack" data-testid="f2-account-detail-page">
      <Link to={ROUTES.accounts} className="text-button">← Accounts</Link>

      <div className="dashboard-actions account-detail-header">
        <div className="account-detail-title">
          <AccountAvatar name={loaded.name} size="md" />
          <div>
            <h1>{loaded.name}</h1>
            <p className="muted">
              Code {loaded.code} · {loaded.status}
            </p>
            <p className="muted">Customer profile · fees · billing · QuickBooks</p>
          </div>
          <CodePill code={loaded.code} />
        </div>
        <div className="dashboard-actions">
          <AimsButton variant="ghost" onClick={onRevert} disabled={!dirty || saving}>
            Revert
          </AimsButton>
          <AimsButton
            variant="primary"
            data-testid="f2-account-save"
            onClick={() => void onSave()}
            disabled={!dirty || saving}
            aria-busy={saving}
          >
            Save
          </AimsButton>
        </div>
      </div>

      {saveMessage && (
        <p className="save-status" role="status">
          {saveMessage}
        </p>
      )}

      <form
        className="dashboard-panel account-profile-grid"
        data-testid="f2-account-profile-form"
        onSubmit={(e) => void onSave(e)}
        aria-busy={saving}
      >
        <label>
          Name
          <input
            required
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
          />
        </label>
        <label>
          Code
          <input
            required
            value={draft.code}
            onChange={(e) => updateDraft({ code: e.target.value })}
          />
        </label>
        <label>
          Status
          <select className="aims-select"
            value={draft.status ?? "Active"}
            onChange={(e) => updateDraft({ status: e.target.value })}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
        <label>
          Input SLA (days)
          <input
            type="number"
            min={0}
            value={draft.slaReceivingDays}
            onChange={(e) => updateDraft({ slaReceivingDays: Number(e.target.value) })}
          />
        </label>
        <label>
          Settlement SLA (days)
          <input
            type="number"
            min={0}
            value={draft.slaProcessingDays}
            onChange={(e) => updateDraft({ slaProcessingDays: Number(e.target.value) })}
          />
        </label>
        <label>
          Sales SLA (days)
          <input
            type="number"
            min={0}
            value={draft.slaShippingDays}
            onChange={(e) => updateDraft({ slaShippingDays: Number(e.target.value) })}
          />
        </label>
        <label>
          Apto %
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={settings.aptoPercentage}
            onChange={(e) =>
              updateSettings({ aptoPercentage: Number(e.target.value) })
            }
          />
        </label>
      </form>

      <div className="tab-bar" role="tablist" aria-label="Account sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "tab-bar__tab tab-bar__tab--active" : "tab-bar__tab"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="dashboard-panel" role="tabpanel">
        {tab === "fees" && (
          <div data-testid="f2-account-fees-grid" className="fee-grid">
            <table>
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col">Rate (USD per unit)</th>
                </tr>
              </thead>
              <tbody>
                {FEE_ROWS.map((row) => (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="Not billed"
                        aria-label={`${row.label} rate USD`}
                        value={settings.fees[row.key] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSettings({
                            fees: {
                              ...settings.fees,
                              [row.key]: val === "" ? null : Number(val),
                            },
                          });
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "rules" && (
          <div data-testid="f2-account-rules" className="rules-grid">
            <p className="muted">
              Rules are stored for this account; processing enforcement is not in Demo 2.
            </p>
            {RULE_ROWS.map((row) => (
              <label key={row.key} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={settings.rules[row.key]}
                  onChange={(e) =>
                    updateSettings({
                      rules: { ...settings.rules, [row.key]: e.target.checked },
                    })
                  }
                />
                {row.label}
              </label>
            ))}
          </div>
        )}

        {tab === "services" && (
          <div data-testid="f2-account-services" className="rules-grid">
            {SERVICE_ROWS.map((row) => (
              <label key={row.key} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={settings.services[row.key]}
                  onChange={(e) =>
                    updateSettings({
                      services: { ...settings.services, [row.key]: e.target.checked },
                    })
                  }
                />
                {row.label}
              </label>
            ))}
          </div>
        )}

        {tab === "billing" && (
          <div data-testid="f2-account-billing" className="grid modal-form">
            <p className="muted">
              Sent to QuickBooks on save when name or billing address changes.
            </p>
            <label>
              Line 1
              <input
                value={settings.billingAddress.line1}
                onChange={(e) =>
                  updateSettings({
                    billingAddress: { ...settings.billingAddress, line1: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Line 2
              <input
                value={settings.billingAddress.line2 ?? ""}
                onChange={(e) =>
                  updateSettings({
                    billingAddress: {
                      ...settings.billingAddress,
                      line2: e.target.value || null,
                    },
                  })
                }
              />
            </label>
            <label>
              City
              <input
                value={settings.billingAddress.city}
                onChange={(e) =>
                  updateSettings({
                    billingAddress: { ...settings.billingAddress, city: e.target.value },
                  })
                }
              />
            </label>
            <label>
              State
              <input
                value={settings.billingAddress.state}
                onChange={(e) =>
                  updateSettings({
                    billingAddress: { ...settings.billingAddress, state: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Postal code
              <input
                value={settings.billingAddress.postalCode}
                onChange={(e) =>
                  updateSettings({
                    billingAddress: {
                      ...settings.billingAddress,
                      postalCode: e.target.value,
                    },
                  })
                }
              />
            </label>
            <label>
              Country
              <input
                value={settings.billingAddress.country}
                onChange={(e) =>
                  updateSettings({
                    billingAddress: { ...settings.billingAddress, country: e.target.value },
                  })
                }
              />
            </label>
          </div>
        )}

        {tab === "history" && (
          <div data-testid="f2-account-changelog">
            <div className="filter-row">
              <label>
                Field
                <input
                  value={changeField}
                  onChange={(e) => setChangeField(e.target.value)}
                  placeholder="e.g. Name"
                />
              </label>
              <label>
                From
                <input type="date" value={changeFrom} onChange={(e) => setChangeFrom(e.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={changeTo} onChange={(e) => setChangeTo(e.target.value)} />
              </label>
              <AimsButton variant="secondary" onClick={() => void reloadChanges()}>
                Apply filters
              </AimsButton>
            </div>
            <DataTable
              ariaLabel="Account change history"
              rows={changes}
              rowKey={(r) => `${r.changedAtUtc}-${r.fieldName}`}
              columns={[
                {
                  id: "when",
                  header: "When",
                  cell: (r) => formatDateTime(r.changedAtUtc),
                },
                { id: "field", header: "Field", cell: (r) => r.fieldName },
                { id: "old", header: "Old value", cell: (r) => r.oldValue ?? "—" },
                { id: "new", header: "New value", cell: (r) => r.newValue ?? "—" },
                { id: "by", header: "Changed by", cell: (r) => r.changedBy },
              ]}
              emptyState={
                <EmptyState title="No changes recorded yet" message="Edits will appear here after save." />
              }
            />
            <div className="pagination-row">
              <AimsButton
                variant="ghost"
                disabled={changesPage <= 1}
                onClick={() => setChangesPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </AimsButton>
              <span className="muted">
                Page {changesPage} · {changesTotal} change{changesTotal === 1 ? "" : "s"}
              </span>
              <AimsButton
                variant="ghost"
                disabled={changesPage * changesPageSize >= changesTotal}
                onClick={() => setChangesPage((p) => p + 1)}
              >
                Next
              </AimsButton>
            </div>
          </div>
        )}

        {tab === "jobs" && (
          <div data-testid="f2-account-jobs-table">
          <DataTable
            ariaLabel="Account jobs"
            rows={jobs}
            rowKey={(j) => j.id}
            columns={[
              {
                id: "job",
                header: "Job",
                cell: (j) => (
                  <Link to={ROUTES.jobs} state={{ highlightJobId: j.id }}>
                    {j.id.slice(0, 8)}
                  </Link>
                ),
              },
              {
                id: "ops",
                header: "Ops status",
                cell: (j) => j.opsStatus ?? "—",
              },
              {
                id: "sla",
                header: "SLA",
                cell: (j) => (
                  <span className={slaPillClass(j.slaStatus)}>{j.slaStatus}</span>
                ),
              },
              {
                id: "due",
                header: "Due",
                cell: (j) => formatDateTime(j.dueDateUtc),
              },
            ]}
            emptyState={
              <EmptyState title="No jobs for this account" message="Jobs linked to this customer will show here." />
            }
          />
          </div>
        )}

        {tab === "qbo" && (
          <div data-testid="f2-account-qbo-panel" className="qbo-account-panel">
            <p>
              Sync status:{" "}
              <span className={qboPillClass(loaded.qboSyncStatus)}>
                {loaded.qboSyncStatus ?? "skipped"}
              </span>
            </p>
            <p>Customer ID: <span className="mono">{loaded.qboCustomerId ?? "—"}</span></p>
            <p>Last sync: {formatDateTime(loaded.qboLastSyncAtUtc)}</p>
            {loaded.qboSyncError && <AlertBanner message={loaded.qboSyncError} />}
            {!loaded.qboCustomerId && (
              <p className="muted">Customer not in QuickBooks yet</p>
            )}
            <div className="dashboard-actions">
              <AimsButton variant="secondary" onClick={() => void onQboSync()}>
                Sync now
              </AimsButton>
              {loaded.qboCustomerId && (
                <a
                  href={`https://app.sandbox.qbo.intuit.com/app/customerdetail?nameId=${loaded.qboCustomerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in QuickBooks
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {error && <AlertBanner message={error} />}
    </div>
  );
}
