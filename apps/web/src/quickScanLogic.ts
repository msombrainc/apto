export type FieldMode = "fixed" | "ask";

export type PresetFields = {
  grade?: string;
  status?: string;
  locationId?: string;
  gradeMode?: FieldMode;
  statusMode?: FieldMode;
  locationMode?: FieldMode;
};

export type ScanPreset = {
  id: string;
  name: string;
  isGlobal: boolean;
  fields: PresetFields;
  createdBy: string;
};

export type ScanAskValues = {
  grade: string;
  status: string;
  locationId: string;
};

export type ScanFieldPayload = {
  grade: string | null;
  status: string | null;
  locationId: string | null;
};

export type UndoSnapshot = {
  assetId: string;
  grade: string | null;
  status: string | null;
  locationId: string | null;
};

const EMPTY_LOCATION_ID = "00000000-0000-0000-0000-000000000000";

export function resolveScanPayload(
  preset: ScanPreset,
  ask?: ScanAskValues,
): ScanFieldPayload {
  const fields = preset.fields;
  const grade =
    fields.gradeMode === "fixed" ? fields.grade ?? null : ask?.grade || null;
  const status =
    fields.statusMode === "fixed"
      ? fields.status ?? null
      : ask?.status || null;
  const locationId =
    fields.locationMode === "fixed"
      ? fields.locationId ?? null
      : ask?.locationId || null;

  return { grade, status, locationId };
}

export function scanPresetNeedsAsk(preset: ScanPreset): boolean {
  const f = preset.fields;
  return (
    f.gradeMode === "ask"
    || f.statusMode === "ask"
    || f.locationMode === "ask"
  );
}

export function buildScanApplyBody(
  preset: ScanPreset,
  ask?: ScanAskValues,
): { body: Record<string, string | null>; empty: boolean } {
  const payload = resolveScanPayload(preset, ask);
  const body: Record<string, string | null> = {};
  if (payload.grade !== null) body.grade = payload.grade;
  if (payload.status !== null) body.status = payload.status;
  if (payload.locationId !== null) body.locationId = payload.locationId;
  return { body, empty: Object.keys(body).length === 0 };
}

export function buildScanUndoBody(
  undo: Pick<UndoSnapshot, "grade" | "status" | "locationId">,
): Record<string, string> {
  return {
    grade: undo.grade ?? "",
    status: undo.status ?? "",
    locationId: undo.locationId ?? EMPTY_LOCATION_ID,
  };
}

export function formatScanFieldChange(
  label: string,
  oldVal: string | null | undefined,
  newVal: string | null | undefined,
): string {
  const o = oldVal?.trim() ? oldVal : "—";
  const n = newVal?.trim() ? newVal : "—";
  return `${label}: ${o} → ${n}`;
}
