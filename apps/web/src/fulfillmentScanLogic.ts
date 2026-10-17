export type FulfillmentScanResult = "match" | "not-on-invoice" | "already-scanned" | "empty";

export function classifyFulfillmentScan(
  rawInput: string,
  invoiceAptoIds: ReadonlySet<string>,
  alreadyScanned: ReadonlySet<string>,
): FulfillmentScanResult {
  const id = rawInput.trim().toUpperCase();
  if (!id) return "empty";
  if (!invoiceAptoIds.has(id)) return "not-on-invoice";
  if (alreadyScanned.has(id)) return "already-scanned";
  return "match";
}
