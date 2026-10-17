import test from "node:test";
import assert from "node:assert/strict";
import type { Asset, ReferenceItem } from "../../apps/web/src/api.ts";
import {
  certificateGroupsForType,
  parseCertificateType,
  splitAssetsForCertificate,
} from "../../apps/web/src/lib/jobCertificates.ts";

const statuses: ReferenceItem[] = [
  {
    id: "1",
    type: "asset-status",
    code: "RECYCLED",
    name: "Recycled",
    parentId: null,
    parentCode: null,
    parentName: null,
    group: "Finished",
    certificateGroup: "Recycled",
    sortOrder: 1,
    isActive: true,
    inUseCount: 0,
  },
  {
    id: "2",
    type: "asset-status",
    code: "WIPED",
    name: "Wiped",
    parentId: null,
    parentCode: null,
    parentName: null,
    group: "WIP",
    certificateGroup: "Wiped",
    sortOrder: 2,
    isActive: true,
    inUseCount: 0,
  },
  {
    id: "3",
    type: "asset-status",
    code: "SHREDDED",
    name: "Shredded",
    parentId: null,
    parentCode: null,
    parentName: null,
    group: "Finished",
    certificateGroup: "Shredded",
    sortOrder: 3,
    isActive: true,
    inUseCount: 0,
  },
  {
    id: "4",
    type: "asset-status",
    code: "AUDIT",
    name: "Audit",
    parentId: null,
    parentCode: null,
    parentName: null,
    group: "WIP",
    certificateGroup: null,
    sortOrder: 3,
    isActive: true,
    inUseCount: 0,
  },
];

function asset(status: string | null): Asset {
  return {
    id: "a",
    aptoId: "A0001",
    jobId: "j",
    partNumberId: null,
    partNumber: "PN-1",
    category: "Laptop",
    serialNumber: "S1",
    grade: null,
    status,
    locationId: null,
    locationName: null,
    createdAtUtc: "2026-01-01T00:00:00.000Z",
    changeLog: [],
  };
}

test("parseCertificateType accepts known query values only", () => {
  assert.equal(parseCertificateType("recycling"), "recycling");
  assert.equal(parseCertificateType("data-destruction"), "data-destruction");
  assert.equal(parseCertificateType("invalid"), null);
  assert.equal(parseCertificateType(null), null);
});

test("certificateGroupsForType maps recycling vs destruction", () => {
  assert.deepEqual([...certificateGroupsForType("recycling")], ["Recycled"]);
  assert.deepEqual([...certificateGroupsForType("data-destruction")], ["Wiped", "Shredded"]);
});

test("splitAssetsForCertificate classifies by reference certificateGroup", () => {
  const rows = [asset("Recycled"), asset("WIPED"), asset("Audit")];
  const recycling = splitAssetsForCertificate(rows, "recycling", statuses);
  assert.equal(recycling.covered.length, 1);
  assert.equal(recycling.excludedCount, 2);

  const withShredded = [...rows, asset("SHREDDED")];
  const destruction = splitAssetsForCertificate(withShredded, "data-destruction", statuses);
  assert.equal(destruction.covered.length, 2);
  assert.deepEqual(
    destruction.covered.map((a) => a.status).sort(),
    ["SHREDDED", "WIPED"],
  );
});
