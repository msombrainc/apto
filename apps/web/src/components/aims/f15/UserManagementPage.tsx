import { useMemo, useState } from "react";
import { AimsButton } from "../Button";
import { DataTable } from "../DataTable";
import { PrototypeBanner } from "../PrototypeBanner";
import {
  F15_ACCESS_HISTORY,
  F15_DEFAULT_PERMISSIONS,
  F15_PERMISSION_FEATURES,
  F15_USERS,
  type F15PermissionFeature,
  type F15UserPermissions,
} from "../../../prototype/f15SampleData";

function formatAccessAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(F15_USERS[0]?.id ?? "");
  const [permissions, setPermissions] = useState<Record<string, F15UserPermissions>>(
    () => ({ ...F15_DEFAULT_PERMISSIONS }),
  );
  const [exportHint, setExportHint] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return F15_USERS;
    return F15_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q)
        || u.status.toLowerCase().includes(q),
    );
  }, [search]);

  const selectedUser = F15_USERS.find((u) => u.id === selectedUserId) ?? F15_USERS[0];
  const userPerms = selectedUser ? permissions[selectedUser.id] : undefined;

  function togglePermission(feature: F15PermissionFeature) {
    if (!selectedUser || !userPerms) return;
    setPermissions((prev) => ({
      ...prev,
      [selectedUser.id]: {
        ...prev[selectedUser.id],
        [feature]: !prev[selectedUser.id][feature],
      },
    }));
  }

  return (
    <div className="dashboard-stack" data-testid="f15-user-management">
      <PrototypeBanner />

      <section className="dashboard-panel">
        <div className="dashboard-actions">
          <label className="field-inline field-inline--grow">
            <span className="field-label">Search users</span>
            <input
              className="aims-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, or status"
              data-testid="f15-user-search"
            />
          </label>
          <AimsButton
            variant="secondary"
            onClick={() => {
              setExportHint("Export is disabled in this prototype (sample data only).");
            }}
          >
            Export access review
          </AimsButton>
        </div>
        {exportHint && <p className="muted">{exportHint}</p>}

        <DataTable
          ariaLabel="Users"
          tableTestId="f15-user-table"
          rows={filteredUsers}
          rowKey={(u) => u.id}
          selectedKey={selectedUser?.id}
          onRowClick={(u) => setSelectedUserId(u.id)}
          columns={[
            { id: "name", header: "Name", cell: (u) => u.name },
            { id: "email", header: "Email", cell: (u) => u.email },
            { id: "status", header: "Status", cell: (u) => u.status },
          ]}
          emptyState={<p className="muted">No users match this search.</p>}
        />
      </section>

      {selectedUser && userPerms && (
        <section className="dashboard-panel" aria-labelledby="f15-permissions-title">
          <h2 id="f15-permissions-title" className="panel-title">
            Permissions — {selectedUser.name}
          </h2>
          <div className="f15-permissions-grid" data-testid="f15-permissions-grid">
            {F15_PERMISSION_FEATURES.map((feature) => (
              <label key={feature} className="f15-permission-toggle">
                <input
                  type="checkbox"
                  checked={userPerms[feature]}
                  onChange={() => togglePermission(feature)}
                  data-testid={`f15-perm-${feature.replace(/\s+/g, "-").toLowerCase()}`}
                />
                <span>{feature}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-panel" aria-labelledby="f15-access-history-title">
        <h2 id="f15-access-history-title" className="panel-title">Access change history</h2>
        <DataTable
          ariaLabel="Access change history"
          tableTestId="f15-access-history"
          rows={F15_ACCESS_HISTORY}
          rowKey={(r) => r.id}
          columns={[
            { id: "at", header: "When", cell: (r) => formatAccessAt(r.atUtc) },
            { id: "user", header: "User", cell: (r) => r.userName },
            { id: "feature", header: "Feature", cell: (r) => r.feature },
            { id: "change", header: "Change", cell: (r) => r.change },
            { id: "by", header: "Changed by", cell: (r) => r.changedBy },
          ]}
        />
      </section>
    </div>
  );
}
