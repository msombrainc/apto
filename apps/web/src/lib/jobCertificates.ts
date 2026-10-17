import type { Asset, ReferenceItem } from "../api";

export type CertificateType = "recycling" | "data-destruction";

const RECYCLING_GROUPS = new Set(["Recycled"]);
const DESTRUCTION_GROUPS = new Set(["Wiped", "Shredded"]);

export function certificateGroupsForType(type: CertificateType): Set<string> {
  return type === "recycling" ? RECYCLING_GROUPS : DESTRUCTION_GROUPS;
}

export function certificateTypeLabel(type: CertificateType): string {
  return type === "recycling" ? "Certificate of Recycling" : "Certificate of Data Destruction";
}

function statusCertificateGroup(
  status: string | null | undefined,
  statuses: ReferenceItem[],
): string | null {
  if (!status?.trim()) return null;
  const needle = status.trim().toLowerCase();
  const match = statuses.find(
    (s) => s.code.toLowerCase() === needle || s.name.toLowerCase() === needle,
  );
  return match?.certificateGroup ?? null;
}

export type CertificateAssetSplit = {
  covered: Asset[];
  excludedCount: number;
};

export function splitAssetsForCertificate(
  assets: Asset[],
  type: CertificateType,
  statuses: ReferenceItem[],
): CertificateAssetSplit {
  const allowed = certificateGroupsForType(type);
  const covered: Asset[] = [];
  let excludedCount = 0;
  for (const asset of assets) {
    const group = statusCertificateGroup(asset.status, statuses);
    if (group && allowed.has(group)) {
      covered.push(asset);
    } else {
      excludedCount += 1;
    }
  }
  return { covered, excludedCount };
}

export function parseCertificateType(raw: string | null): CertificateType | null {
  if (raw === "recycling" || raw === "data-destruction") return raw;
  return null;
}
