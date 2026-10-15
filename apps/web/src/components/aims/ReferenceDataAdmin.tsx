import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CategoryRow,
  ReferenceItem,
  ReferenceWrite,
  createCategory,
  createReferenceItem,
  deleteReferenceItem,
  listCategories,
  listReferenceItems,
  updateCategory,
  updateReferenceItem,
} from "../../api";
import { useDebounced } from "../../useDebounced";
import { AlertBanner } from "./AlertBanner";
import { AimsButton } from "./Button";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { IconPlus, IconRefresh } from "./icons";
import { Modal } from "./Modal";

type AdminTypeKey =
  | "facility"
  | "location"
  | "job-status"
  | "asset-status"
  | "grade"
  | "damage"
  | "categories";

const TYPE_OPTIONS: { value: AdminTypeKey; label: string }[] = [
  { value: "facility", label: "Facilities" },
  { value: "location", label: "Locations" },
  { value: "job-status", label: "Job (Ops) statuses" },
  { value: "asset-status", label: "Asset statuses" },
  { value: "grade", label: "Grades" },
  { value: "damage", label: "Damages" },
  { value: "categories", label: "Categories" },
];

type SortKey = "code" | "name" | "sortOrder";

export function ReferenceDataAdmin() {
  const [adminType, setAdminType] = useState<AdminTypeKey>("facility");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [facilityId, setFacilityId] = useState("");
  const [facilities, setFacilities] = useState<ReferenceItem[]>([]);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("sortOrder");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [refItems, setRefItems] = useState<ReferenceItem[]>([]);
  const [refTotal, setRefTotal] = useState(0);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [catTotal, setCatTotal] = useState(0);
  const pageSize = 50;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<ReferenceItem | null>(null);
  const [editingCat, setEditingCat] = useState<CategoryRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    sortOrder: 0,
    parentId: "",
    group: "WIP",
    certificateGroup: "",
  });

  const isCategories = adminType === "categories";
  const total = isCategories ? catTotal : refTotal;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const loadFacilities = useCallback(async () => {
    try {
      const res = await listReferenceItems("facility", { pageSize: 200 });
      setFacilities(res.items.filter((f) => f.isActive));
      if (!facilityId && res.items.length > 0) {
        setFacilityId(res.items[0].id);
      }
    } catch {
      setFacilities([]);
    }
  }, [facilityId]);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (isCategories) {
        const res = await listCategories({
          q: debouncedSearch,
          page,
          pageSize,
          includeInactive,
        });
        setCategories(res.items);
        setCatTotal(res.total);
        setLiveMessage(`Loaded ${res.total} entries`);
        return;
      }

      if (adminType === "location" && !facilityId) {
        setRefItems([]);
        setRefTotal(0);
        return;
      }

      const res = await listReferenceItems(adminType, {
        q: debouncedSearch,
        page,
        pageSize,
        includeInactive,
        facilityId: adminType === "location" ? facilityId : undefined,
        sortBy,
        sortDir,
      });
      setRefItems(res.items);
      setRefTotal(res.total);
      setLiveMessage(`Loaded ${res.total} entries`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reference data");
    } finally {
      setLoading(false);
    }
  }, [
    adminType,
    debouncedSearch,
    facilityId,
    includeInactive,
    isCategories,
    page,
    pageSize,
    sortBy,
    sortDir,
  ]);

  useEffect(() => {
    void loadFacilities();
  }, [loadFacilities]);

  useEffect(() => {
    setPage(1);
  }, [adminType, debouncedSearch, includeInactive, facilityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openAdd() {
    setEditingRef(null);
    setEditingCat(null);
    setFormError(null);
    setForm({
      code: "",
      name: "",
      sortOrder: 0,
      parentId: facilityId || facilities[0]?.id || "",
      group: "WIP",
      certificateGroup: "",
    });
    setModalOpen(true);
  }

  function openEditRef(row: ReferenceItem) {
    setEditingRef(row);
    setEditingCat(null);
    setFormError(null);
    setForm({
      code: row.code,
      name: row.name,
      sortOrder: row.sortOrder,
      parentId: row.parentId ?? facilityId,
      group: row.group ?? "WIP",
      certificateGroup: row.certificateGroup ?? "",
    });
    setModalOpen(true);
  }

  function openEditCat(row: CategoryRow) {
    setEditingCat(row);
    setEditingRef(null);
    setFormError(null);
    setForm({
      code: "",
      name: row.name,
      sortOrder: 0,
      parentId: "",
      group: "WIP",
      certificateGroup: "",
    });
    setModalOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setError(null);
    try {
      if (isCategories) {
        if (editingCat) {
          await updateCategory(editingCat.id, form.name.trim(), editingCat.isActive);
        } else {
          await createCategory(form.name.trim());
        }
        setModalOpen(false);
        await refresh();
        return;
      }

      const body: ReferenceWrite = {
        code: form.code.trim(),
        name: form.name.trim(),
        sortOrder: form.sortOrder,
        parentId: adminType === "location" ? form.parentId : null,
        group: adminType === "asset-status" ? form.group : null,
        certificateGroup:
          adminType === "asset-status" && form.certificateGroup
            ? form.certificateGroup
            : null,
      };

      if (editingRef) {
        await updateReferenceItem(adminType, editingRef.id, {
          ...body,
          isActive: editingRef.isActive,
        });
      } else {
        await createReferenceItem(adminType, body);
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function toggleActiveRef(row: ReferenceItem) {
    setError(null);
    try {
      await updateReferenceItem(adminType, row.id, {
        code: row.code,
        name: row.name,
        sortOrder: row.sortOrder,
        parentId: row.parentId,
        group: row.group,
        certificateGroup: row.certificateGroup,
        isActive: !row.isActive,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function toggleActiveCat(row: CategoryRow) {
    setError(null);
    try {
      await updateCategory(row.id, row.name, !row.isActive);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function onDeleteRef(row: ReferenceItem) {
    if (row.inUseCount > 0) return;
    if (!window.confirm(`Delete ${row.code}? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteReferenceItem(adminType, row.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  function sortAria(key: SortKey): "ascending" | "descending" | "none" {
    if (sortBy !== key) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  const typeLabel = TYPE_OPTIONS.find((t) => t.value === adminType)?.label ?? "Entry";

  const refColumns = useMemo(() => {
    const cols = [];
    if (!isCategories) {
      cols.push({
        id: "code",
        header: (
          <button type="button" className="th-sort" onClick={() => toggleSort("code")} aria-sort={sortAria("code")}>
            Code
          </button>
        ),
        cell: (row: ReferenceItem) => <code className="code-pill">{row.code}</code>,
      });
    }
    cols.push({
      id: "name",
      header: isCategories
        ? "Name"
        : (
            <button type="button" className="th-sort" onClick={() => toggleSort("name")} aria-sort={sortAria("name")}>
              Name
            </button>
          ),
      cell: (row: ReferenceItem | CategoryRow) => row.name,
    });
    if (adminType === "location") {
      cols.push({
        id: "facility",
        header: "Facility",
        cell: (row: ReferenceItem) => row.parentCode ?? row.parentName ?? "—",
      });
    }
    if (adminType === "asset-status") {
      cols.push({
        id: "group",
        header: "Group",
        cell: (row: ReferenceItem) => row.group ?? "—",
      });
      cols.push({
        id: "cert",
        header: "Certificate",
        cell: (row: ReferenceItem) => row.certificateGroup ?? "—",
      });
    }
    if (!isCategories) {
      cols.push({
        id: "sortOrder",
        header: (
          <button type="button" className="th-sort" onClick={() => toggleSort("sortOrder")} aria-sort={sortAria("sortOrder")}>
            Sort order
          </button>
        ),
        cell: (row: ReferenceItem) => row.sortOrder,
        className: "num",
      });
    }
    cols.push({
      id: "inUse",
      header: isCategories ? "Part numbers" : "In use",
      className: "num",
      cell: (row: ReferenceItem | CategoryRow) =>
        isCategories ? (row as CategoryRow).partNumberCount : (row as ReferenceItem).inUseCount,
    });
    cols.push({
      id: "status",
      header: "Status",
      cell: (row: ReferenceItem | CategoryRow) => (
        <span
          className={`status-pill ${row.isActive ? "status-pill--active" : "status-pill--inactive"}`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    });
    cols.push({
      id: "actions",
      header: "Actions",
      cell: (row: ReferenceItem | CategoryRow) => {
        const ref = row as ReferenceItem;
        const cat = row as CategoryRow;
        const inUse = isCategories ? cat.partNumberCount : ref.inUseCount;
        return (
          <div className="row-actions">
            <button
              type="button"
              className="btn-link"
              data-testid={!isCategories ? `ref-admin-edit-${ref.id}` : undefined}
              onClick={() => (isCategories ? openEditCat(cat) : openEditRef(ref))}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn-link"
              data-testid="ref-admin-toggle-active"
              aria-pressed={row.isActive}
              onClick={() => void (isCategories ? toggleActiveCat(cat) : toggleActiveRef(ref))}
            >
              {row.isActive ? `Deactivate ${isCategories ? cat.name : ref.code}` : `Activate ${isCategories ? cat.name : ref.code}`}
            </button>
            {!isCategories && inUse === 0 && (
              <button type="button" className="btn-link btn-link--danger" onClick={() => void onDeleteRef(ref)}>
                Delete
              </button>
            )}
            {!isCategories && inUse > 0 && (
              <span className="muted" title={`In use by ${inUse} record(s). Deactivate instead.`}>
                In use
              </span>
            )}
          </div>
        );
      },
    });
    return cols;
  }, [adminType, isCategories, sortBy, sortDir]);

  const rows = isCategories ? categories : refItems;

  return (
    <div className="dashboard-stack">
      {error && <AlertBanner message={error} />}

      <div className="dashboard-actions">
        <AimsButton variant="secondary" icon={<IconRefresh />} onClick={() => void refresh()} disabled={loading}>
          Refresh
        </AimsButton>
        <AimsButton variant="primary" icon={<IconPlus />} onClick={openAdd} disabled={loading}>
          Add entry
        </AimsButton>
      </div>

      <section className="dashboard-panel">
        <div className="filter-bar ref-admin-filters">
          <label className="filter-field">
            List type
            <select
              data-testid="ref-admin-type-select"
              value={adminType}
              onChange={(e) => setAdminType(e.target.value as AdminTypeKey)}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          {adminType === "location" && (
            <label className="filter-field">
              Facility
              <select
                data-testid="ref-admin-facility-filter"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="filter-check">
            <input
              type="checkbox"
              data-testid="ref-admin-include-inactive"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive
          </label>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="filter-bar">
          <div className="filter-bar__search">
            <input
              data-testid="ref-admin-search"
              type="search"
              placeholder="Search code or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="filter-bar__meta" aria-live="polite">
            {liveMessage || `Showing ${from}–${to} of ${total}`}
          </p>
        </div>

        <DataTable
          ariaLabel="Reference data"
          loading={loading}
          rows={rows}
          rowKey={(row) => row.id}
          columns={refColumns as never}
          emptyState={
            <EmptyState title="No entries" body="Add an entry or adjust search." />
          }
        />

        <div className="paging-footer">
          <AimsButton
            variant="secondary"
            data-testid="ref-admin-paging-prev"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </AimsButton>
          <span>Page {page} of {pageCount}</span>
          <AimsButton
            variant="secondary"
            data-testid="ref-admin-paging-next"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </AimsButton>
        </div>
      </section>

      <Modal
        title={editingRef || editingCat ? `Edit ${editingRef?.code ?? editingCat?.name}` : `Add ${typeLabel}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form className="grid form-grid" onSubmit={onSave}>
          {formError && <AlertBanner message={formError} />}
          {!isCategories && (
            <label>
              Code
              <input
                required
                maxLength={32}
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            </label>
          )}
          <label>
            Name
            <input
              required
              maxLength={128}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          {!isCategories && (
            <label>
              Sort order
              <input
                type="number"
                min={0}
                required
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </label>
          )}
          {adminType === "location" && (
            <label>
              Facility
              <select
                required
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>{f.code}</option>
                ))}
              </select>
            </label>
          )}
          {adminType === "asset-status" && (
            <>
              <label>
                Group
                <select
                  required
                  value={form.group}
                  onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
                >
                  <option value="WIP">WIP</option>
                  <option value="Finished">Finished</option>
                  <option value="Exception">Exception</option>
                </select>
              </label>
              <label>
                Certificate group
                <select
                  value={form.certificateGroup}
                  onChange={(e) => setForm((f) => ({ ...f, certificateGroup: e.target.value }))}
                >
                  <option value="">—</option>
                  <option value="Recycled">Recycled</option>
                  <option value="Wiped">Wiped</option>
                  <option value="Shredded">Shredded</option>
                </select>
              </label>
            </>
          )}
          <div className="form-actions">
            <AimsButton variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </AimsButton>
            <AimsButton variant="primary" type="submit" data-testid="ref-admin-form-save">
              Save
            </AimsButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
