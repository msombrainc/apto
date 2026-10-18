import type { ReactNode } from "react";

type FilterBarProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  countLabel: string;
  searchId?: string;
  children?: ReactNode;
  /** Filters-only rows (e.g. QBO queue) without a search field. */
  hideSearch?: boolean;
};

export function FilterBar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  countLabel,
  searchId = "aims-filter-search",
  children,
  hideSearch = false,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      {!hideSearch && (
        <label className="filter-bar__search" htmlFor={searchId}>
          <span className="sr-only">{searchPlaceholder}</span>
          <input
            id={searchId}
            data-testid={searchId}
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
      )}
      {children}
      <span className="filter-bar__meta muted" aria-live="polite">{countLabel}</span>
    </div>
  );
}
