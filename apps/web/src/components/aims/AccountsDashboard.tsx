import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Account, AccountWrite } from "../../api";
import { accountPath } from "../../routing/paths";
import { AccountAvatar } from "./AccountAvatar";
import { AimsButton } from "./Button";
import { CodePill } from "./CodePill";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";
import { IconClock, IconPlus, IconRefresh, IconUsers } from "./icons";
import { Modal } from "./Modal";
import { SlaSegmentBar, slaTotalDays } from "./SlaSegmentBar";
import { StatCard } from "./StatCard";
import {
  accountsKpiLabel,
  accountsKpiSublabel,
  type AccountStatusFilter,
} from "../../accountsKpiLabels";
import { accountStatusPillClass } from "./accountStatusPill";

export type { AccountStatusFilter };

type AccountsDashboardProps = {
  accounts: Account[];
  query: string;
  statusFilter: AccountStatusFilter;
  onStatusFilterChange: (status: AccountStatusFilter) => void;
  onQueryChange: (q: string) => void;
  loading: boolean;
  form: AccountWrite;
  onFormChange: (form: AccountWrite) => void;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onCreate: (e: FormEvent) => void;
};

function averageSlaDays(accounts: Account[]): number {
  if (accounts.length === 0) return 0;
  const sum = accounts.reduce(
    (acc, a) => acc + slaTotalDays(a.slaReceivingDays, a.slaProcessingDays, a.slaShippingDays),
    0,
  );
  return Math.round((sum / accounts.length) * 10) / 10;
}

export function AccountsDashboard({
  accounts,
  query,
  statusFilter,
  onStatusFilterChange,
  onQueryChange,
  loading,
  form,
  onFormChange,
  createOpen,
  onCreateOpenChange,
  onRefresh,
  onCreate,
}: AccountsDashboardProps) {
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const avg = averageSlaDays(accounts);

  return (
    <div className="dashboard-stack">
      <div className="dashboard-actions">
        <AimsButton variant="secondary" icon={<IconRefresh />} onClick={onRefresh}>
          Refresh
        </AimsButton>
        <AimsButton variant="primary" icon={<IconPlus />} onClick={() => onCreateOpenChange(true)}>
          New account
        </AimsButton>
      </div>

      <div className="kpi-row kpi-row--2" role="region" aria-label="Accounts summary">
        <StatCard
          label={accountsKpiLabel(statusFilter)}
          value={accounts.length}
          sublabel={accountsKpiSublabel(statusFilter, query)}
          icon={<IconUsers />}
        />
        <StatCard
          label="Average SLA"
          value={accounts.length === 0 ? "—" : Math.round(avg)}
          sublabel={accounts.length === 0 ? undefined : "days"}
          icon={<IconClock />}
        />
      </div>

      <section className="dashboard-panel">
        <FilterBar
          searchPlaceholder="Search accounts"
          searchValue={query}
          onSearchChange={onQueryChange}
          countLabel={`${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
          searchId="accounts-filter"
        />
        <div className="filter-advanced-toggle">
          <button
            type="button"
            className="aims-btn aims-btn--ghost"
            aria-expanded={moreFiltersOpen}
            onClick={() => setMoreFiltersOpen((o) => !o)}
          >
            {moreFiltersOpen ? "Hide filters" : "More filters"}
          </button>
        </div>
        {moreFiltersOpen && (
          <div className="jobs-advanced-filters" data-testid="accounts-more-filters">
            <label className="filter-bar__select">
              Status
              <select
                className="aims-select"
                value={statusFilter}
                onChange={(e) =>
                  onStatusFilterChange(e.target.value as AccountStatusFilter)
                }
                data-testid="f2-accounts-filter-status"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Both">Both</option>
              </select>
            </label>
          </div>
        )}
        <DataTable
          ariaLabel="Customer accounts"
          loading={loading}
          rows={accounts}
          rowKey={(a) => a.id}
          columns={[
            {
              id: "account",
              header: "Account",
              cell: (a) => (
                <span className="account-cell">
                  <AccountAvatar name={a.name} size="sm" />
                  <Link
                    to={accountPath(a.id)}
                    data-testid={`f2-accounts-row-link-${a.id}`}
                  >
                    {a.name}
                  </Link>
                </span>
              ),
            },
            {
              id: "code",
              header: "Code",
              cell: (a) => <CodePill code={a.code} />,
            },
            {
              id: "status",
              header: "Status",
              cell: (a) => (
                <span className={accountStatusPillClass(a.status)}>{a.status}</span>
              ),
            },
            {
              id: "sla",
              header: "SLA",
              cell: (a) => (
                <SlaSegmentBar
                  variant="bar-only"
                  receivingDays={a.slaReceivingDays}
                  processingDays={a.slaProcessingDays}
                  shippingDays={a.slaShippingDays}
                />
              ),
            },
            {
              id: "open",
              header: "",
              cell: (a) => (
                <Link
                  to={accountPath(a.id)}
                  className="accounts-open-chevron"
                  aria-label={`Open ${a.name}`}
                  data-testid={`f2-accounts-open-${a.id}`}
                >
                  <span aria-hidden>›</span>
                </Link>
              ),
            },
          ]}
          emptyState={
            <EmptyState title="No accounts yet" message="Create a customer account to get started." />
          }
        />
      </section>

      <Modal title="New account" open={createOpen} onClose={() => onCreateOpenChange(false)}>
        <form className="grid modal-form" onSubmit={onCreate}>
          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Code
            <input
              required
              value={form.code}
              onChange={(e) => onFormChange({ ...form, code: e.target.value })}
            />
          </label>
          <label>
            Status
            <select className="aims-select"
              value={form.status ?? "Active"}
              onChange={(e) => onFormChange({ ...form, status: e.target.value })}
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
              value={form.slaReceivingDays}
              onChange={(e) =>
                onFormChange({ ...form, slaReceivingDays: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Settlement SLA (days)
            <input
              type="number"
              min={0}
              value={form.slaProcessingDays}
              onChange={(e) =>
                onFormChange({ ...form, slaProcessingDays: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Sales SLA (days)
            <input
              type="number"
              min={0}
              value={form.slaShippingDays}
              onChange={(e) =>
                onFormChange({ ...form, slaShippingDays: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Apto %
            <input
              type="number"
              min={0}
              max={100}
              value={form.settings?.aptoPercentage ?? 0}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  settings: {
                    ...(form.settings ?? { aptoPercentage: 0 }),
                    aptoPercentage: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <div className="modal-form__actions">
            <AimsButton type="button" variant="ghost" onClick={() => onCreateOpenChange(false)}>
              Cancel
            </AimsButton>
            <AimsButton type="submit" variant="primary">Create account</AimsButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
