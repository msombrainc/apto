export type InventoryFilterFields = {
  search: string;
  accountId: string;
  facility: string;
  grade: string;
  status: string;
  category: string;
  createdFrom: string;
  createdTo: string;
  pasteCodes: string;
};

export function inventoryFiltersActive(filters: InventoryFilterFields): boolean {
  return Boolean(
    filters.search.trim() ||
      filters.accountId ||
      filters.facility ||
      filters.grade ||
      filters.status ||
      filters.category ||
      filters.createdFrom ||
      filters.createdTo ||
      filters.pasteCodes.trim(),
  );
}
