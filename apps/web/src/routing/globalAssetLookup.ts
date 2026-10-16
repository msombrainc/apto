import { inventoryAssetPath } from "./paths";

export type LookupAssetResult = { id: string };

export type GlobalLookupOutcome =
  | { kind: "noop" }
  | { kind: "navigate"; path: string }
  | { kind: "error"; message: string };

export async function resolveGlobalAssetLookup(
  code: string,
  lookup: (c: string) => Promise<LookupAssetResult>,
): Promise<GlobalLookupOutcome> {
  const trimmed = code.trim();
  if (!trimmed) return { kind: "noop" };
  try {
    const result = await lookup(trimmed);
    return { kind: "navigate", path: inventoryAssetPath(result.id) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Asset lookup failed";
    return { kind: "error", message };
  }
}
