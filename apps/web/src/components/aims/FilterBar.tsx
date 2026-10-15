type FilterBarProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  countLabel: string;
  searchId?: string;
};

export function FilterBar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  countLabel,
  searchId = "aims-filter-search",
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <label className="filter-bar__search" htmlFor={searchId}>
        <span className="sr-only">{searchPlaceholder}</span>
        <input
          id={searchId}
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>
      <span className="filter-bar__meta muted" aria-live="polite">{countLabel}</span>
    </div>
  );
}
