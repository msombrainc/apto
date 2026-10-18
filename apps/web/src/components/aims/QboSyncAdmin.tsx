import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  QboRequestRow,
  QboStatus,
  getQboStatus,
  listQboRequests,
  retryQboRequest,
} from "../../api";
import { AlertBanner } from "./AlertBanner";
import { AimsButton } from "./Button";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { IconRefresh } from "./icons";

const OPERATION_LABELS: Record<string, string> = {
  CreateCustomer: "Create customer",
  UpdateCustomer: "Update customer",
  CreateInvoice: "Create invoice",
};

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Processing", label: "Processing" },
  { value: "Sent", label: "Sent" },
  { value: "Failed", label: "Failed" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "CreateCustomer", label: "Create customer" },
  { value: "UpdateCustomer", label: "Update customer" },
  { value: "CreateInvoice", label: "Create invoice" },
];

function statusPillClass(status: string): string {
  switch (status) {
    case "Pending":
      return "status-pill status-pill--pending";
    case "Processing":
      return "status-pill status-pill--processing";
    case "Sent":
      return "status-pill status-pill--active";
    case "Failed":
      return "status-pill status-pill--failed";
    default:
      return "status-pill";
  }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export function QboSyncAdmin() {
  const [searchParams] = useSearchParams();
  const initialOp = searchParams.get("operation") ?? "";
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(
    TYPE_OPTIONS.some((o) => o.value === initialOp) ? initialOp : "",
  );
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<QboStatus | null>(null);
  const [items, setItems] = useState<QboRequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      setConnection(await getQboStatus());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load connection status");
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listQboRequests({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        page,
        pageSize,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sync queue");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, typeFilter]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadStatus(), loadRequests()]);
  }, [loadStatus, loadRequests]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadRequests();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadRequests]);

  async function onConnect() {
    if (!connection?.connectUrl) return;
    window.location.href = connection.connectUrl;
  }

  async function onRetry(row: QboRequestRow) {
    setRetryingId(row.id);
    setError(null);
    try {
      await retryQboRequest(row.id);
      await loadRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetryingId(null);
    }
  }

  const columns = useMemo(
    () => [
      {
        id: "type",
        header: "Type",
        cell: (row: QboRequestRow) =>
          OPERATION_LABELS[row.operation] ?? row.operation,
      },
      {
        id: "aims",
        header: "AIMS record",
        cell: (row: QboRequestRow) =>
          row.entityType === "Account" ? (
            <Link
              to={`/accounts/${row.entityId}`}
              className="btn-link"
              data-testid={`qbo-sync-open-aims-${row.entityId}`}
            >
              {row.entityLabel}
            </Link>
          ) : (
            row.entityLabel
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row: QboRequestRow) => (
          <span className={statusPillClass(row.status)}>
            <span className="sr-only">Status: </span>
            {row.status}
          </span>
        ),
      },
      {
        id: "attempts",
        header: "Attempts",
        className: "num",
        cell: (row: QboRequestRow) => `${row.attempts} / 5`,
      },
      {
        id: "error",
        header: "Last error",
        cell: (row: QboRequestRow) =>
          row.lastError ? (
            <span className="qbo-sync-error-cell" title={row.lastError}>
              {row.lastError}
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "qboId",
        header: "QBO ID",
        cell: (row: QboRequestRow) =>
          row.qboId ? (
            <span className="mono">
              {row.qboId}
              <br />
              <a
                href={`https://app.sandbox.qbo.intuit.com/app/customerdetail?nameId=${row.qboId}`}
                className="btn-link"
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`qbo-sync-open-qbo-${row.id}`}
              >
                Open in QuickBooks
              </a>
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "created",
        header: "Created",
        cell: (row: QboRequestRow) => formatDateTime(row.createdAtUtc),
      },
      {
        id: "sent",
        header: "Sent",
        cell: (row: QboRequestRow) =>
          row.sentAtUtc ? formatDateTime(row.sentAtUtc) : "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row: QboRequestRow) =>
          row.status === "Failed" ? (
            <AimsButton
              variant="secondary"
              className="aims-btn--compact"
              data-testid={`qbo-sync-retry-${row.id}`}
              aria-label={`Retry sync for ${row.entityLabel}`}
              disabled={retryingId === row.id}
              aria-busy={retryingId === row.id}
              onClick={() => void onRetry(row)}
            >
              Retry
            </AimsButton>
          ) : null,
      },
    ],
    [retryingId],
  );

  return (
    <div className="dashboard-stack" data-testid="qbo-sync-page">
      {error && <AlertBanner message={error} />}

      <div className="dashboard-actions">
        <AimsButton
          variant="secondary"
          icon={<IconRefresh />}
          data-testid="qbo-sync-refresh"
          onClick={() => void refreshAll()}
          disabled={loading || statusLoading}
        >
          Refresh
        </AimsButton>
      </div>

      <section
        className="dashboard-panel"
        data-testid="qbo-sync-connection"
        aria-live="polite"
      >
        {statusLoading ? (
          <p role="status" className="muted">Loading connection…</p>
        ) : connection?.connected ? (
          <>
            <span className="status-pill status-pill--active">Connected</span>
            <p className="muted">
              Company: {connection.companyName}
              {connection.realmId && (
                <span> · Realm {connection.realmId}</span>
              )}
            </p>
          </>
        ) : (
          <>
            <span className="status-pill status-pill--inactive">Not connected</span>
            <p className="muted">
              QuickBooks is not connected. Customer sync will queue until you connect.
            </p>
            <AimsButton
              variant="primary"
              data-testid="qbo-sync-connect"
              disabled={!connection?.connectUrl}
              onClick={() => void onConnect()}
            >
              Connect to QuickBooks
            </AimsButton>
          </>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="filter-bar">
          <label className="filter-field">
            Status
            <select className="aims-select"
              data-testid="qbo-sync-filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            Type
            <select className="aims-select"
              data-testid="qbo-sync-filter-type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <span className="filter-bar__meta muted">
            Showing {from}–{to} of {total}
          </span>
        </div>

        <DataTable
          ariaLabel="QuickBooks sync queue"
          columns={columns}
          rows={items}
          rowKey={(row) => row.id}
          loading={loading}
          emptyState={
            <EmptyState
              title="No sync requests"
              message="Account saves will enqueue work here."
            />
          }
          tableTestId="qbo-sync-table"
        />

        <div className="paging-footer">
          <AimsButton
            variant="secondary"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </AimsButton>
          <span className="muted">Page {page} of {pageCount}</span>
          <AimsButton
            variant="secondary"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </AimsButton>
        </div>
      </section>
    </div>
  );
}
