/** Params passed to listInventoryAssets — stable contract for filter auto-refresh. */
export type InventoryListParams = {
  q: string;
  accountId?: string;
  facilityCode?: string;
  grade?: string;
  status?: string;
  locationId?: string;
  category?: string;
  createdFrom?: string;
  createdTo?: string;
  codes?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: "asc" | "desc";
};

export function buildInventoryListParams(
  debouncedQuery: string,
  accountId: string,
  facilityCode: string,
  grade: string,
  status: string,
  locationId: string,
  category: string,
  createdFrom: string,
  createdTo: string,
  codes: string,
  page: number,
  pageSize: number,
  sortBy: string,
  sortDir: "asc" | "desc",
): InventoryListParams {
  const params: InventoryListParams = {
    q: debouncedQuery,
    page,
    pageSize,
    sortBy,
    sortDir,
  };
  if (accountId) params.accountId = accountId;
  if (facilityCode) params.facilityCode = facilityCode;
  if (grade) params.grade = grade;
  if (status) params.status = status;
  if (locationId) params.locationId = locationId;
  if (category) params.category = category;
  if (createdFrom) params.createdFrom = createdFrom;
  if (createdTo) params.createdTo = createdTo;
  if (codes.trim()) params.codes = codes.trim();
  return params;
}
