/** Params passed to listInventoryAssets — stable contract for filter auto-refresh. */
export type InventoryListParams = {
  q: string;
  accountId?: string;
  facilityCode?: string;
};

export function buildInventoryListParams(
  debouncedQuery: string,
  accountId: string,
  facilityCode: string,
): InventoryListParams {
  const params: InventoryListParams = { q: debouncedQuery };
  if (accountId) params.accountId = accountId;
  if (facilityCode) params.facilityCode = facilityCode;
  return params;
}
