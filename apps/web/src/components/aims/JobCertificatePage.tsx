import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getJob,
  listJobAssets,
  listReferenceItems,
  type Asset,
  type Job,
  type ReferenceItem,
} from "../../api";
import {
  certificateTypeLabel,
  parseCertificateType,
  splitAssetsForCertificate,
  type CertificateType,
} from "../../lib/jobCertificates";
import { jobPath } from "../../routing/paths";
import { AimsButton } from "./Button";
import { AlertBanner } from "./AlertBanner";
import { DataTable } from "./DataTable";

type Props = {
  jobId: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function complianceText(type: CertificateType): string {
  if (type === "recycling") {
    return (
      "This certificate confirms that the listed assets were processed for recycling in accordance "
      + "with applicable environmental and data-handling policies. Material disposition records are "
      + "maintained by Apto Inventory Management Services."
    );
  }
  return (
    "This certificate confirms that the listed assets underwent data destruction (wiping or "
    + "physical destruction) in accordance with applicable standards. Destruction methods are "
    + "documented per asset status shown below."
  );
}

export function JobCertificatePage({ jobId }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = parseCertificateType(searchParams.get("type"));
  const [job, setJob] = useState<Job | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [statuses, setStatuses] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [j, rows, ref] = await Promise.all([
        getJob(jobId),
        listJobAssets(jobId),
        listReferenceItems("asset-status", { pageSize: 100 }),
      ]);
      setJob(j);
      setAssets(rows);
      setStatuses(ref.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load job");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const split = useMemo(() => {
    if (!typeParam) return null;
    return splitAssetsForCertificate(assets, typeParam, statuses);
  }, [assets, typeParam, statuses]);

  const selectType = (type: CertificateType) => {
    setSearchParams({ type });
  };

  const onPrint = () => {
    window.print();
  };

  if (loading) {
    return <p className="muted">Loading certificate…</p>;
  }

  if (error || !job) {
    return (
      <div data-testid="f10-certificate-page">
        <AlertBanner variant="error">{error ?? "Job not found"}</AlertBanner>
        <Link to={jobPath(jobId)}>Back to job</Link>
      </div>
    );
  }

  return (
    <div className="f10-certificate-page" data-testid="f10-certificate-page">
      <header className="f10-certificate-toolbar">
        <div>
          <h1>Compliance certificate</h1>
          <p className="muted">
            {job.accountName} ({job.accountCode})
            {job.facilityCode ? ` · ${job.facilityCode}` : ""}
          </p>
        </div>
        <div className="dashboard-actions f10-no-print">
          <Link to={jobPath(jobId)} className="aims-btn aims-btn--secondary">
            Back to job
          </Link>
        </div>
      </header>

      {!typeParam && (
        <div className="f10-type-grid f10-no-print" role="group" aria-label="Certificate type">
          <button
            type="button"
            className="f10-type-card"
            data-testid="f10-type-recycling"
            onClick={() => selectType("recycling")}
            aria-pressed={typeParam === "recycling"}
          >
            <h2>Recycling</h2>
            <p className="muted">Assets with Recycled status</p>
          </button>
          <button
            type="button"
            className="f10-type-card"
            data-testid="f10-type-destruction"
            onClick={() => selectType("data-destruction")}
            aria-pressed={typeParam === "data-destruction"}
          >
            <h2>Data Destruction</h2>
            <p className="muted">Wiped and Shredded assets</p>
          </button>
        </div>
      )}

      {typeParam && split && (
        <>
          <div className="dashboard-actions f10-no-print" style={{ marginBottom: "1rem" }}>
            <AimsButton variant="secondary" onClick={() => setSearchParams({})}>
              Change type
            </AimsButton>
            <AimsButton variant="primary" data-testid="f10-print" onClick={onPrint}>
              Print
            </AimsButton>
          </div>

          <article
            className="f10-certificate-doc dashboard-panel"
            data-testid="f10-certificate-preview"
          >
            <div className="f10-sample-watermark" data-testid="f10-sample-watermark" aria-hidden>
              SAMPLE
            </div>
            <header className="f10-cert-header">
              <p className="f10-cert-issuer">Apto Inventory Management Services</p>
              <h2>{certificateTypeLabel(typeParam)}</h2>
            </header>

            <dl className="f10-cert-meta">
              <div>
                <dt>Client</dt>
                <dd>{job.accountName} ({job.accountCode})</dd>
              </div>
              <div>
                <dt>Job</dt>
                <dd>{job.id}</dd>
              </div>
              <div>
                <dt>Facility</dt>
                <dd>{job.facilityCode ?? "—"}</dd>
              </div>
              <div>
                <dt>Processing period</dt>
                <dd>
                  {formatDate(job.startDateUtc)} – {formatDate(job.dueDateUtc ?? null)}
                </dd>
              </div>
            </dl>

            <DataTable
              ariaLabel="Covered assets"
              tableTestId="f10-asset-table"
              columns={[
                { id: "aptoId", header: "Apto ID", cell: (row) => row.aptoId },
                { id: "serial", header: "Serial", cell: (row) => row.serialNumber ?? "—" },
                { id: "part", header: "Part #", cell: (row) => row.partNumber ?? "—" },
                { id: "category", header: "Category", cell: (row) => row.category ?? "—" },
                { id: "status", header: "Status", cell: (row) => row.status ?? "—" },
              ]}
              rows={split.covered}
              rowKey={(row) => row.id}
              emptyState={<p className="muted">No covered assets for this certificate type.</p>}
            />

            <p className="f10-cert-total">
              <strong>{split.covered.length}</strong> asset{split.covered.length === 1 ? "" : "s"} covered
            </p>

            {split.excludedCount > 0 && (
              <p className="muted" data-testid="f10-excluded-count">
                <strong>{split.excludedCount}</strong> asset
                {split.excludedCount === 1 ? "" : "s"} not included on this certificate
              </p>
            )}

            <p className="f10-cert-compliance">{complianceText(typeParam)}</p>

            <footer className="f10-cert-signatures">
              <div>
                <span className="f10-sig-line" />
                <span>Authorized representative</span>
              </div>
              <div>
                <span className="f10-sig-line" />
                <span>Date</span>
              </div>
            </footer>
          </article>
        </>
      )}
    </div>
  );
}
