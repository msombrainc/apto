/** True when lookupAssetByCode failed because the serial is not in AIMS (not a transport error). */
export function isAssetLookupNotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("no asset found")) return true;
  return /lookup failed: 404\b/.test(msg);
}
