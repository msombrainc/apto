import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createJobInvoice,
  getJob,
  getJobInvoicePreview,
  listJobInvoices,
  type InvoicePreviewLine,
  type Job,
  type ServiceInvoiceRow,
} from "../../api";
import { ROUTES, accountPath, jobPath } from "../../routing/paths";
import { AlertBanner } from "./AlertBanner";
import { AimsButton } from "./Button";

type Props = { jobId: string };

function invoiceStatusClass(status: string): string {
  switch (status) {
    case "Sent":
      return "status-pill status-pill--active";
    case "Failed":
      return "status-pill status-pill--failed";
    case "Queued":
    case "Processing":
      return "status-pill status-pill--pending";
    default:
      return "status-pill status-pill--inactive";
  }
}

export function JobInvoicePage({ jobId }: Props) {
  const [job, setJob] = useState<Job | null>(null);
  const [lines, setLines] = useState<InvoicePreviewLine[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<ServiceInvoiceRow[]>([]);
  const [qboCustomerId, setQboCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { retainError?: string }) => {
    setLoading(true);
    if (!opts?.retainError) setError(null);
    try {
      const [j, preview, invoices] = await Promise.all([
        getJob(jobId),
        getJobInvoicePreview(jobId),
        listJobInvoices(jobId),
      ]);
      setJob(j);
      setLines(preview.lines);
      setQboCustomerId(preview.qboCustomerId);
      setQty(
        Object.fromEntries(preview.lines.map((l) => [l.serviceKey, l.defaultQuantity])),
      );
      setHistory(invoices);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoice preview");
      setJob(null);
    } finally {
      setLoading(false);
      if (opts?.retainError) setError(opts.retainError);
    }
  }, [jobId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const q = qty[line.serviceKey] ?? 0;
      return sum + Math.round(line.unitRate * q * 100) / 100;
    }, 0);
  }, [lines, qty]);

  const onSend = async () => {
    setSending(true);
    setError(null);
    try {
      await createJobInvoice(jobId, {
        note,
        lines: lines.map((l) => ({
          serviceKey: l.serviceKey,
          quantity: qty[l.serviceKey] ?? 0,
        })),
      });
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Send failed";
      await refresh({ retainError: msg });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="muted">Loading invoice preview…</p>;
  }

  if (!job) {
    return (
      <div data-testid="f11-invoice-page">
        <AlertBanner message={error ?? "Job not found"} />
        <Link to={jobPath(jobId)}>Back to job</Link>
      </div>
    );
  }

  return (
    <div className="f11-invoice-page" data-testid="f11-invoice-page">
      <header className="page-header">
        <div>
          <h1>Service invoice</h1>
          <p className="muted">
            {job.accountName} · Job {job.id.slice(0, 8)}
          </p>
        </div>
        <Link to={jobPath(jobId)} className="aims-btn aims-btn--secondary">
          Back to job
        </Link>
      </header>

      {!qboCustomerId && (
        <div className="dashboard-panel f11-qbo-blocked" data-testid="f11-qbo-blocked">
          <p>
            Account is not synced to QuickBooks.{" "}
            <Link to={accountPath(job.accountId)}>Sync account to QuickBooks</Link> before sending.
          </p>
        </div>
      )}

      {error && (
        <div data-testid="f11-send-error">
          <AlertBanner message={error} />
        </div>
      )}

      <div className="f11-invoice-layout">
        <section className="dashboard-panel f11-editor">
          <h2 className="panel-subtitle">Editor</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Qty</th>
                <th>Unit rate</th>
                <th>Amount</th>
                <th>Hint</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const q = qty[line.serviceKey] ?? 0;
                const amount = Math.round(line.unitRate * q * 100) / 100;
                return (
                  <tr key={line.serviceKey} data-testid={`f11-line-${line.serviceKey}`}>
                    <td>{line.label}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={q}
                        onChange={(e) =>
                          setQty((prev) => ({
                            ...prev,
                            [line.serviceKey]: Number.parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        data-testid={`f11-qty-${line.serviceKey}`}
                      />
                    </td>
                    <td>{line.unitRate.toFixed(2)}</td>
                    <td>{amount.toFixed(2)}</td>
                    <td className="muted">{line.quantityHint}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <label className="stack-field">
            <span>Note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              data-testid="f11-note"
              rows={3}
            />
          </label>
          <p className="f11-total" data-testid="f11-total">
            <strong>Total:</strong> ${total.toFixed(2)}
          </p>
          <AimsButton
            data-testid="f11-send"
            disabled={!qboCustomerId || sending || lines.length === 0}
            onClick={() => void onSend()}
          >
            {sending ? "Sending…" : "Send to QuickBooks"}
          </AimsButton>
        </section>

        <section className="dashboard-panel f11-history">
          <h2 className="panel-subtitle">History</h2>
          {history.length === 0 ? (
            <p className="muted">No invoices yet.</p>
          ) : (
            <ul className="f11-history-list">
              {history.map((row) => (
                <li key={row.id} data-testid={`f11-history-item-${row.id}`}>
                  <span className="f11-history-date">
                    {new Date(row.createdAtUtc).toLocaleString()}
                  </span>
                  <span className={invoiceStatusClass(row.status)}>{row.status}</span>
                  <span className="f11-history-total">${row.total.toFixed(2)}</span>
                  {row.qboDocNumber && <span>QBO #{row.qboDocNumber}</span>}
                  {row.lastError && (
                    <span className="f11-history-error">
                      <span className="error">{row.lastError}</span>
                      <Link to={`${ROUTES.qboSync}?operation=CreateInvoice`}>
                        View in QuickBooks sync queue
                      </Link>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
