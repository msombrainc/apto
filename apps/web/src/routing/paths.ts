export const ROUTES = {
  accounts: "/accounts",
  accountDetail: "/accounts/:accountId",
  jobs: "/jobs",
  jobDetail: "/jobs/:jobId",
  jobSpreadsheetImport: "/jobs/:jobId/import/spreadsheet",
  jobBulkUnserialized: "/jobs/:jobId/import/bulk",
  jobCertificate: "/jobs/:jobId/certificate",
  inventory: "/inventory",
  inventoryAsset: "/inventory/assets/:assetId",
  scan: "/operations/scan",
  slaDashboard: "/operations/sla-dashboard",
  referenceData: "/admin/reference-data",
  partNumbers: "/admin/part-numbers",
  qboSync: "/admin/qbo-sync",
} as const;

export function inventoryAssetPath(assetId: string): string {
  return `/inventory/assets/${encodeURIComponent(assetId)}`;
}

export function accountPath(accountId: string): string {
  return `/accounts/${encodeURIComponent(accountId)}`;
}

export function jobPath(jobId: string): string {
  return `/jobs/${encodeURIComponent(jobId)}`;
}

export function jobSpreadsheetImportPath(jobId: string): string {
  return `/jobs/${encodeURIComponent(jobId)}/import/spreadsheet`;
}

export function jobBulkUnserializedPath(jobId: string): string {
  return `/jobs/${encodeURIComponent(jobId)}/import/bulk`;
}

export function jobCertificatePath(jobId: string): string {
  return `/jobs/${encodeURIComponent(jobId)}/certificate`;
}
