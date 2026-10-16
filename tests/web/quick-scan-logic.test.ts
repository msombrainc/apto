import test from "node:test";
import assert from "node:assert/strict";
import {
  buildScanApplyBody,
  buildScanUndoBody,
  formatScanFieldChange,
  resolveScanPayload,
  scanPresetNeedsAsk,
  type ScanPreset,
} from "../../apps/web/src/quickScanLogic.ts";

const basePreset = (fields: ScanPreset["fields"]): ScanPreset => ({
  id: "p1",
  name: "Test",
  isGlobal: true,
  createdBy: "demo",
  fields,
});

test("resolveScanPayload applies fixed grade and status (acceptance: preset applies fixed grade)", () => {
  const preset = basePreset({
    grade: "B",
    gradeMode: "fixed",
    status: "IN-AUDIT",
    statusMode: "fixed",
    locationMode: "ask",
  });
  assert.deepEqual(resolveScanPayload(preset), {
    grade: "B",
    status: "IN-AUDIT",
    locationId: null,
  });
  const { body, empty } = buildScanApplyBody(preset);
  assert.equal(empty, false);
  assert.deepEqual(body, { grade: "B", status: "IN-AUDIT" });
});

test("scanPresetNeedsAsk when any field is ask mode", () => {
  assert.equal(
    scanPresetNeedsAsk(
      basePreset({
        gradeMode: "fixed",
        grade: "A",
        statusMode: "ask",
        locationMode: "fixed",
        locationId: "loc-1",
      }),
    ),
    true,
  );
  assert.equal(
    scanPresetNeedsAsk(
      basePreset({
        gradeMode: "fixed",
        grade: "A",
        statusMode: "fixed",
        status: "Wiped",
        locationMode: "fixed",
        locationId: "loc-1",
      }),
    ),
    false,
  );
});

test("resolveScanPayload uses ask values when modes are ask", () => {
  const preset = basePreset({
    gradeMode: "ask",
    statusMode: "ask",
    locationMode: "ask",
  });
  assert.deepEqual(
    resolveScanPayload(preset, {
      grade: "U",
      status: "IN-AUDIT",
      locationId: "loc-9",
    }),
    { grade: "U", status: "IN-AUDIT", locationId: "loc-9" },
  );
});

test("buildScanApplyBody empty when preset has no applicable fields (Preset has no fields to apply)", () => {
  const preset = basePreset({
    gradeMode: "ask",
    statusMode: "ask",
    locationMode: "ask",
  });
  const { body, empty } = buildScanApplyBody(preset);
  assert.equal(empty, true);
  assert.deepEqual(body, {});
});

test("buildScanUndoBody restores prior grade status location (acceptance: undo)", () => {
  assert.deepEqual(
    buildScanUndoBody({
      grade: "U",
      status: "IN-AUDIT",
      locationId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    }),
    {
      grade: "U",
      status: "IN-AUDIT",
      locationId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    },
  );
  assert.deepEqual(
    buildScanUndoBody({ grade: null, status: null, locationId: null }),
    {
      grade: "",
      status: "",
      locationId: "00000000-0000-0000-0000-000000000000",
    },
  );
});

test("formatScanFieldChange for session log summaries", () => {
  assert.equal(formatScanFieldChange("grade", "U", "A"), "grade: U → A");
  assert.equal(formatScanFieldChange("grade", null, "B"), "grade: — → B");
});
