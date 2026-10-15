import type { ReactNode } from "react";
import { IconChevronRight } from "./icons";

type Column<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  ariaLabel: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  selectedKey?: string | null;
  loading?: boolean;
  emptyState?: ReactNode;
};

export function DataTable<T>({
  ariaLabel,
  columns,
  rows,
  rowKey,
  onRowClick,
  rowClassName,
  selectedKey,
  loading,
  emptyState,
}: DataTableProps<T>) {
  const interactive = Boolean(onRowClick);

  return (
    <div className="data-table-wrap">
      <table className="data-table" aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.id} scope="col" className={col.className}>
                {col.header}
              </th>
            ))}
            {interactive && (
              <th scope="col" className="data-table__chevron-col">
                <span className="sr-only">Open</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td
                colSpan={columns.length + (interactive ? 1 : 0)}
                className="data-table__loading"
                role="status"
                aria-live="polite"
              >
                <span className="inline-spinner" aria-hidden="true" />
                Loading…
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row) => {
              const key = rowKey(row);
              const selected = selectedKey === key;
              const extra = rowClassName?.(row) ?? "";
              return (
                <tr
                  key={key}
                  className={`data-table__row${interactive ? " row-selectable" : ""}${selected ? " row-selected" : ""} ${extra}`.trim()}
                  tabIndex={interactive ? 0 : undefined}
                  onClick={interactive ? () => onRowClick?.(row) : undefined}
                  onKeyDown={
                    interactive
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick?.(row);
                          }
                        }
                      : undefined
                  }
                  aria-selected={interactive ? selected : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={col.className}>{col.cell(row)}</td>
                  ))}
                  {interactive && (
                    <td className="data-table__chevron-col">
                      <IconChevronRight />
                    </td>
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>
      {!loading && rows.length === 0 && emptyState}
    </div>
  );
}
