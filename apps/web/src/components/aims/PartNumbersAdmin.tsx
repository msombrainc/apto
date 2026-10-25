import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  PartNumberRow,
  createPartNumberAdmin,
  deletePartNumberAdmin,
  listCategories,
  listPartNumbers,
  searchPartNumbers,
  updatePartNumberAdmin,
  type CategoryRow,
} from "../../api";
import { useDebounced } from "../../useDebounced";
import { AlertBanner } from "./AlertBanner";
import { AimsButton } from "./Button";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { IconPlus, IconRefresh } from "./icons";
import { Modal } from "./Modal";
import { FilterBar } from "./FilterBar";

type SortKey = "number" | "categoryName" | "assetCount";

export function PartNumbersAdmin() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [rows, setRows] = useState<PartNumberRow[]>([]);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<PartNumberRow | null>(null);
  const [deleting, setDeleting] = useState<PartNumberRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formNumber, setFormNumber] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [replacementId, setReplacementId] = useState("");
  const [replacementSearch, setReplacementSearch] = useState("");
  const [replacementOptions, setReplacementOptions] = useState<PartNumberRow[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const loadCategories = useCallback(async () => {
    try {
      const res = await listCategories({ pageSize: 200, includeInactive: false });
      setCategories(res.items);
    } catch {
      setCategories([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await listPartNumbers({
        q: debouncedSearch,
        page,
        pageSize,
        sortBy,
        sortDir,
      });
      setRows(res.items);
      setTotal(res.total);
      setLiveMessage(`Loaded ${res.total} entries`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load part numbers");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, sortBy, sortDir]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!deleteOpen || !deleting) return;
    const q = replacementSearch.trim();
    if (q.length < 1) {
      setReplacementOptions([]);
      return;
    }
    void (async () => {
      try {
        const items = await searchPartNumbers(q);
        setReplacementOptions(
          items
            .filter((p) => p.id !== deleting.id)
            .slice(0, 20)
            .map((p) => ({
              id: p.id,
              number: p.number,
              categoryId: null,
              categoryName: p.categoryName,
              assetCount: 0,
            })),
        );
      } catch {
        setReplacementOptions([]);
      }
    })();
  }, [deleteOpen, deleting, replacementSearch]);

  function openAdd() {
    setEditing(null);
    setFormError(null);
    setFormNumber("");
    setFormCategoryId("");
    setModalOpen(true);
  }

  function openEdit(row: PartNumberRow) {
    setEditing(row);
    setFormError(null);
    setFormNumber(row.number);
    setFormCategoryId(row.categoryId ?? "");
    setModalOpen(true);
  }

  function openDelete(row: PartNumberRow) {
    setDeleting(row);
    setDeleteError(null);
    setReplacementId("");
    setReplacementSearch("");
    setReplacementOptions([]);
    setDeleteOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setError(null);
    const number = formNumber.trim();
    if (!number) {
      setFormError("Part number is required.");
      return;
    }
    const categoryId = formCategoryId ? formCategoryId : null;
    try {
      if (editing) {
        await updatePartNumberAdmin(editing.id, number, categoryId);
      } else {
        await createPartNumberAdmin(number, categoryId);
      }
      setModalOpen(false);
      await refresh();
      setLiveMessage(`Saved part number ${number}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function onConfirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      const needsReplacement = deleting.assetCount > 0;
      if (needsReplacement && !replacementId) {
        setDeleteError("Choose a replacement part number.");
        return;
      }
      await deletePartNumberAdmin(
        deleting.id,
        needsReplacement ? replacementId : undefined,
      );
      setDeleteOpen(false);
      setDeleting(null);
      await refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
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

  const columns = useMemo(
    () => [
      {
        id: "number",
        header: (
          <button
            type="button"
            className="th-sort"
            onClick={() => toggleSort("number")}
            aria-sort={sortAria("number")}
          >
            Part number
          </button>
        ),
        cell: (row: PartNumberRow) => <code className="code-pill">{row.number}</code>,
      },
      {
        id: "categoryName",
        header: (
          <button
            type="button"
            className="th-sort"
            onClick={() => toggleSort("categoryName")}
            aria-sort={sortAria("categoryName")}
          >
            Category
          </button>
        ),
        cell: (row: PartNumberRow) => row.categoryName ?? "—",
      },
      {
        id: "assetCount",
        header: (
          <button
            type="button"
            className="th-sort"
            onClick={() => toggleSort("assetCount")}
            aria-sort={sortAria("assetCount")}
          >
            Assets
          </button>
        ),
        className: "num",
        cell: (row: PartNumberRow) => row.assetCount,
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row: PartNumberRow) => (
          <div className="row-actions">
            <button type="button" className="btn-link" onClick={() => openEdit(row)}>
              Edit
            </button>
            <button
              type="button"
              className="btn-link btn-link--danger"
              onClick={() => openDelete(row)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [sortBy, sortDir],
  );

  const deleteNeedsReplacement = (deleting?.assetCount ?? 0) > 0;

  return (
    <div className="dashboard-stack" data-testid="part-numbers-page">
      {error && <AlertBanner message={error} />}

      <div className="dashboard-actions">
        <AimsButton variant="secondary" icon={<IconRefresh />} onClick={() => void refresh()} disabled={loading}>
          Refresh
        </AimsButton>
        <AimsButton variant="primary" icon={<IconPlus />} onClick={openAdd} disabled={loading}>
          Add part number
        </AimsButton>
      </div>

      <section className="dashboard-panel admin-preview-panel">
        <FilterBar
          searchPlaceholder="Search part number"
          searchValue={search}
          onSearchChange={setSearch}
          countLabel={liveMessage || `Showing ${from}–${to} of ${total}`}
          searchId="pn-admin-search"
        />

        <DataTable
          ariaLabel="Part numbers"
          loading={loading}
          rows={rows}
          rowKey={(row) => row.id}
          columns={columns}
          emptyState={
            <EmptyState title="No part numbers" body="Add a part number or adjust search." />
          }
        />

        <div className="paging-footer">
          <AimsButton
            variant="secondary"
            data-testid="pn-admin-paging-prev"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </AimsButton>
          <span>Page {page} of {pageCount}</span>
          <AimsButton
            variant="secondary"
            data-testid="pn-admin-paging-next"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </AimsButton>
        </div>
      </section>

      <Modal
        title={editing ? "Edit part number" : "Add part number"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form className="grid form-grid" onSubmit={onSave}>
          {formError && <AlertBanner message={formError} />}
          <label>
            Part number
            <input
              required
              maxLength={100}
              value={formNumber}
              onChange={(e) => setFormNumber(e.target.value)}
            />
          </label>
          <label>
            Category
            <select className="aims-select"
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <AimsButton variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </AimsButton>
            <AimsButton variant="primary" type="submit" data-testid="pn-admin-form-save">
              Save
            </AimsButton>
          </div>
        </form>
      </Modal>

      <Modal
        title={deleteNeedsReplacement ? "Delete part number and reassign assets?" : "Delete part number?"}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      >
        {deleting && (
          <div className="grid form-grid">
            {deleteError && <AlertBanner message={deleteError} />}
            {deleteNeedsReplacement ? (
              <p>
                <strong>{deleting.number}</strong> is used by <strong>{deleting.assetCount}</strong> asset(s).
                Choose a replacement part number. All affected assets will be updated and logged.
              </p>
            ) : (
              <p>Delete <strong>{deleting.number}</strong>? This cannot be undone.</p>
            )}
            {deleteNeedsReplacement && (
              <label>
                Replacement part number
                <input
                  data-testid="pn-admin-delete-replacement"
                  type="search"
                  aria-label="Replacement part number"
                  value={replacementSearch}
                  onChange={(e) => {
                    setReplacementSearch(e.target.value);
                    setReplacementId("");
                  }}
                  list="pn-replacement-options"
                />
              </label>
            )}
            {deleteNeedsReplacement && replacementOptions.length > 0 && (
              <ul className="replacement-picker" role="listbox" aria-label="Replacement part number">
                {replacementOptions.map((p) => (
                  <li key={p.id} role="option" aria-selected={replacementId === p.id}>
                    <button
                      type="button"
                      className={`btn-link${replacementId === p.id ? " is-selected" : ""}`}
                      onClick={() => {
                        setReplacementId(p.id);
                        setReplacementSearch(p.number);
                      }}
                    >
                      {p.number}
                      {p.categoryName ? ` — ${p.categoryName}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="form-actions">
              <AimsButton variant="ghost" type="button" onClick={() => setDeleteOpen(false)}>
                Cancel
              </AimsButton>
              <AimsButton
                variant="primary"
                data-testid="pn-admin-delete-confirm"
                disabled={deleteNeedsReplacement && !replacementId}
                onClick={() => void onConfirmDelete()}
              >
                Delete
              </AimsButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
