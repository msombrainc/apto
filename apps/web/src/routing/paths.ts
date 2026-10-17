export const ROUTES = {
  accounts: "/accounts",
  jobs: "/jobs",
  inventory: "/inventory",
  inventoryAsset: "/inventory/assets/:assetId",
  scan: "/operations/scan",
  referenceData: "/admin/reference-data",
  partNumbers: "/admin/part-numbers",
  qboSync: "/admin/qbo-sync",
} as const;

export function inventoryAssetPath(assetId: string): string {
  return `/inventory/assets/${encodeURIComponent(assetId)}`;
}
