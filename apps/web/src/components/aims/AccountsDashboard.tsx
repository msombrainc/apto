import type { FormEvent } from "react";
import type { Account, AccountWrite } from "../../api";
import { AccountAvatar } from "./AccountAvatar";
import { AimsButton } from "./Button";
import { CodePill } from "./CodePill";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";
import { IconPlus, IconRefresh, IconUsers } from "./icons";
import { Modal } from "./Modal";
import { SlaSegmentBar, slaTotalDays } from "./SlaSegmentBar";
import { StatCard } from "./StatCard";

type AccountsDashboardProps = {
  accounts: Account[];
  query: string;
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
  onQueryChange,
  loading,
  form,
  onFormChange,
  createOpen,
  onCreateOpenChange,
  onRefresh,
  onCreate,
}: AccountsDashboardProps) {
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

      <div className="kpi-row kpi-row--2">
        <StatCard
          label="Accounts"
          value={accounts.length}
          sublabel="Active customer records"
          icon={<IconUsers />}
        />
        <StatCard
          label="Average SLA"
          value={accounts.length === 0 ? "—" : `${avg}d`}
          sublabel="Receiving + processing + shipping"
          icon={<IconUsers />}
        />
      </div>

      <section className="dashboard-panel">
        <FilterBar
          searchPlaceholder="Filter by name or code"
          searchValue={query}
          onSearchChange={onQueryChange}
          countLabel={`${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
          searchId="accounts-filter"
        />
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
                  <span>{a.name}</span>
                </span>
              ),
            },
            {
              id: "code",
              header: "Code",
              cell: (a) => <CodePill code={a.code} />,
            },
            {
              id: "sla",
              header: "SLA",
              cell: (a) => (
                <SlaSegmentBar
                  receivingDays={a.slaReceivingDays}
                  processingDays={a.slaProcessingDays}
                  shippingDays={a.slaShippingDays}
                />
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
            SLA receiving (days)
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
            SLA processing (days)
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
            SLA shipping (days)
            <input
              type="number"
              min={0}
              value={form.slaShippingDays}
              onChange={(e) =>
                onFormChange({ ...form, slaShippingDays: Number(e.target.value) })
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
