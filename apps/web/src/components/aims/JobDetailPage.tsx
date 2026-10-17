import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Account,
  Asset,
  Job,
  JobWrite,
  createJobAsset,
  getJob,
  listAccounts,
  listFacilities,
  listJobAssets,
  listPartNumbers,
  listReferenceItems,
  updateJob,
  type ReferenceItem,
} from "../../api";
import { ROUTES, accountPath, inventoryAssetPath, jobSpreadsheetImportPath } from "../../routing/paths";
import {
  formatSlaDaysRemaining,
  jobTotalAssetCount,
  needsAddAssetConfirm,
} from "../../jobDetailHelpers";
import { AccountAvatar } from "./AccountAvatar";
import { AimsButton } from "./Button";
import { CodePill } from "./CodePill";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import { StatCard } from "./StatCard";
import { IconBriefcase, IconPlus } from "./icons";

type JobDetailPageProps = {
  jobId: string;
  accounts?: Account[];
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function jobToWrite(job: Job): JobWrite {
  if (!job.startDateUtc) {
    throw new Error("job missing startDateUtc");
  }
  return {
    accountId: job.accountId,
    facilityCode: job.facilityCode ?? undefined,
    opsStatus: job.opsStatus ?? undefined,
    startDateUtc: job.startDateUtc,
    dueDateUtc: job.dueDateUtc,
  };
}

function opsStatusSelectValue(
  opsStatus: string | null | undefined,
  items: ReferenceItem[],
): string {
  if (!opsStatus) return "";
  const match = items.find(
    (s) =>
      s.code.toLowerCase() === opsStatus.toLowerCase()
      || s.name.toLowerCase() === opsStatus.toLowerCase(),
  );
  return match?.code ?? opsStatus;
}

export function JobDetailPage({ jobId, accounts: accountsProp }: JobDetailPageProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(accountsProp ?? []);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [opsStatuses, setOpsStatuses] = useState<ReferenceItem[]>([]);
  const [draft, setDraft] = useState<JobWrite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [stubAction, setStubAction] = useState<string | null>(null);
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [partQuery, setPartQuery] = useState("");
  const [partOptions, setPartOptions] = useState<{ id: string; number: string }[]>([]);
  const [assetForm, setAssetForm] = useState({ partNumberId: "", newPartNumber: "", serialNumber: "" });
  const [assetError, setAssetError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setSaveError(null);
    try {
      const j = await getJob(jobId);
      setJob(j);
      setDraft(jobToWrite(j));
      const rows = await listJobAssets(jobId);
      setAssets(rows);
    } catch (e) {
      if (e instanceof Error && e.message === "job not found") {
        setNotFound(true);
        setJob(null);
      } else {
        throw e;
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (accountsProp?.length) return;
    void listAccounts().then(setAccounts).catch(() => undefined);
  }, [accountsProp]);

  useEffect(() => {
    void listFacilities().then(setFacilities).catch(() => undefined);
    void listReferenceItems("job-status", { pageSize: 50 })
      .then((res) => setOpsStatuses(res.items))
      .catch(() => undefined);
  }, []);

  const totalAssets = useMemo(() => (job ? jobTotalAssetCount(job) : 0), [job]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!job || !draft) return;
    setSaveError(null);
    setSaveOk(false);
    try {
      const updated = await updateJob(job.id, draft);
      setJob(updated);
      setDraft(jobToWrite(updated));
      setSaveOk(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function searchParts() {
    const res = await listPartNumbers({ q: partQuery, pageSize: 20 });
    setPartOptions(res.items.map((p) => ({ id: p.id, number: p.number })));
  }

  async function submitAsset(e: FormEvent) {
    e.preventDefault();
    if (!job) return;
    setAssetError(null);
    const run = async () => {
      await createJobAsset(job.id, {
        partNumberId: assetForm.partNumberId || undefined,
        newPartNumber: assetForm.newPartNumber || undefined,
        serialNumber: assetForm.serialNumber || undefined,
      });
      setAssetForm({ partNumberId: "", newPartNumber: "", serialNumber: "" });
      await load();
    };
    if (needsAddAssetConfirm(job.opsStatus) && !confirmAdd) {
      setConfirmAdd(true);
      return;
    }
    setConfirmAdd(false);
    try {
      await run();
    } catch (err) {
      setAssetError(err instanceof Error ? err.message : "Add asset failed");
    }
  }

  if (notFound) {
    return (
      <div className="dashboard-panel" data-testid="f3-job-not-found">
        <EmptyState title="Job not found" description={`No job with id ${jobId}.`} />
        <Link to={ROUTES.jobs}>← Jobs</Link>
      </div>
    );
  }

  if (loading || !job || !draft) {
    return (
      <div className="page-content" data-testid="f3-job-detail-page" aria-busy="true">
        <p className="muted">Loading job…</p>
      </div>
    );
  }

  return (
    <div className="page-content dashboard-stack" data-testid="f3-job-detail-page">
      <Link to={ROUTES.jobs} className="back-link">← Jobs</Link>

      <header className="dashboard-panel" data-testid="f3-job-header">
        <p className="muted">Job {job.id.slice(0, 8)}</p>
        <div className="account-detail-header">
          <AccountAvatar name={job.accountName} />
          <div>
            <h1>
              <Link to={accountPath(job.accountId)}>{job.accountName}</Link>
            </h1>
            <CodePill code={job.accountCode} />
            {job.facilityCode && <CodePill code={job.facilityCode} />}
          </div>
          <span className={`sla-pill sla-pill--${job.slaStatus}`}>
            {formatSlaDaysRemaining(job.daysRemaining)}
          </span>
        </div>
        <p className="muted">
          Created {new Date(job.createdAtUtc).toLocaleDateString()} · {job.slaTotalDays}-day SLA
        </p>
        <div className="dashboard-actions">
          <Link
            to={jobSpreadsheetImportPath(jobId)}
            className="aims-btn aims-btn--secondary"
            data-testid="f3-action-import"
          >
            Import spreadsheet
          </Link>
          <AimsButton variant="secondary" data-testid="f3-action-bulk" onClick={() => setStubAction("bulk")}>
            Bulk unserialized
          </AimsButton>
          <AimsButton variant="secondary" data-testid="f3-action-certificate" onClick={() => setStubAction("certificate")}>
            Certificate
          </AimsButton>
          <AimsButton variant="secondary" data-testid="f3-action-invoice" onClick={() => setStubAction("invoice")}>
            Service invoice
          </AimsButton>
        </div>
      </header>

      <div className="kpi-row kpi-row--5" data-testid="f3-job-progress" role="region" aria-label="Job progress">
        <StatCard label="Total assets" value={totalAssets} icon={<IconBriefcase />} />
        <StatCard label="WIP" value={job.wipAssetCount} />
        <StatCard label="Finished" value={job.finishedAssetCount} />
        <StatCard label="Exceptions" value={job.exceptionAssetCount} />
        <StatCard label="Progress" value={`${job.progressPercent}%`} />
      </div>

      <form className="dashboard-panel" data-testid="f3-job-edit-form" onSubmit={onSave}>
        <h2>Job details</h2>
        {saveError && <p className="form-error">{saveError}</p>}
        {saveOk && <p role="status">Job saved</p>}
        <div className="grid grid--2">
          <label>
            Account
            <select
              value={draft.accountId}
              onChange={(e) => setDraft({ ...draft, accountId: e.target.value })}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
              ))}
            </select>
          </label>
          <label>
            Facility
            <select
              value={draft.facilityCode ?? ""}
              onChange={(e) => setDraft({ ...draft, facilityCode: e.target.value || undefined })}
            >
              <option value="">—</option>
              {facilities.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label>
            Ops status
            <select
              value={opsStatusSelectValue(draft.opsStatus, opsStatuses)}
              onChange={(e) => setDraft({ ...draft, opsStatus: e.target.value || undefined })}
            >
              <option value="">—</option>
              {opsStatuses.map((s) => (
                <option key={s.id} value={s.code}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            Start date
            <input
              type="date"
              value={toDateInput(draft.startDateUtc)}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  startDateUtc: e.target.value ? `${e.target.value}T00:00:00.000Z` : draft.startDateUtc,
                })
              }
            />
          </label>
          <label>
            Due date
            <input
              type="date"
              value={toDateInput(draft.dueDateUtc ?? null)}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  dueDateUtc: e.target.value ? `${e.target.value}T00:00:00.000Z` : null,
                })
              }
            />
          </label>
        </div>
        <div className="dashboard-actions">
          <AimsButton type="submit" variant="primary" data-testid="f3-job-save">Save</AimsButton>
          <AimsButton type="button" variant="secondary" onClick={() => setDraft(jobToWrite(job))}>
            Revert
          </AimsButton>
        </div>
      </form>

      <section className="dashboard-panel">
        <h2>Assets ({assets.length})</h2>
        <form data-testid="f3-add-asset-form" className="grid grid--2" onSubmit={submitAsset}>
          {assetError && <p className="form-error">{assetError}</p>}
          <label>
            Part search
            <input value={partQuery} onChange={(e) => setPartQuery(e.target.value)} />
          </label>
          <AimsButton type="button" variant="secondary" onClick={() => void searchParts()}>Search parts</AimsButton>
          <label>
            Part number
            <select
              value={assetForm.partNumberId}
              onChange={(e) => setAssetForm({ ...assetForm, partNumberId: e.target.value })}
            >
              <option value="">—</option>
              {partOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.number}</option>
              ))}
            </select>
          </label>
          <label>
            Or new part #
            <input
              value={assetForm.newPartNumber}
              onChange={(e) => setAssetForm({ ...assetForm, newPartNumber: e.target.value })}
            />
          </label>
          <label>
            Serial
            <input
              value={assetForm.serialNumber}
              onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
            />
          </label>
          <AimsButton type="submit" variant="primary" icon={<IconPlus />}>Add asset</AimsButton>
        </form>

        {assets.length === 0 ? (
          <EmptyState
            title="No assets on this job yet"
            description="Add the first device as it's received."
          />
        ) : (
          <DataTable
            ariaLabel="Job assets"
            tableTestId="f3-job-assets-table"
            columns={[
              {
                id: "aptoId",
                header: "Apto ID",
                cell: (a) => <Link to={inventoryAssetPath(a.id)}>{a.aptoId}</Link>,
              },
              { id: "serial", header: "Serial", cell: (a) => a.serialNumber ?? "—" },
              { id: "part", header: "Part #", cell: (a) => a.partNumber ?? "—" },
              { id: "category", header: "Category", cell: (a) => a.category ?? "—" },
              { id: "grade", header: "Grade", cell: (a) => a.grade ?? "—" },
              { id: "status", header: "Status", cell: (a) => a.status ?? "—" },
              { id: "loc", header: "Location", cell: (a) => a.locationName ?? "—" },
            ]}
            rows={assets}
            rowKey={(a) => a.id}
          />
        )}
      </section>

      <Modal open={confirmAdd} title="Confirm add asset" onClose={() => setConfirmAdd(false)}>
        <p>This job is {job.opsStatus}. Add asset anyway?</p>
        <AimsButton variant="primary" onClick={() => void submitAsset({ preventDefault: () => {} } as FormEvent)}>
          Confirm
        </AimsButton>
      </Modal>

      <Modal open={stubAction !== null} title="Coming in a later slice" onClose={() => setStubAction(null)}>
        <p>
          {stubAction === "bulk" && "Bulk unserialized creation (F7) is tracked on apto#55."}
          {stubAction === "certificate" && "Certificates (F10) is tracked on apto#58."}
          {stubAction === "invoice" && "Service invoice (F11) is tracked on apto#59."}
        </p>
      </Modal>
    </div>
  );
}
