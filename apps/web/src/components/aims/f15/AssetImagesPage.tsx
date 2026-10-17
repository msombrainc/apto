import { useState } from "react";
import { AimsButton } from "../Button";
import { PrototypeBanner } from "../PrototypeBanner";
import { F15_SAMPLE_ASSETS } from "../../../prototype/f15SampleData";

const MAX_SLOTS = 3;

type SlotState = {
  objectUrl: string | null;
  fileName: string | null;
};

function emptySlots(): SlotState[] {
  return Array.from({ length: MAX_SLOTS }, () => ({ objectUrl: null, fileName: null }));
}

export function AssetImagesPage() {
  const [assetId, setAssetId] = useState(F15_SAMPLE_ASSETS[0]?.aptoId ?? "");
  const asset = F15_SAMPLE_ASSETS.find((a) => a.aptoId === assetId) ?? F15_SAMPLE_ASSETS[0];
  const [slots, setSlots] = useState<SlotState[]>(emptySlots);

  function onPickFile(slotIndex: number, file: File | undefined) {
    if (!file) return;
    setSlots((prev) => {
      const next = [...prev];
      if (next[slotIndex].objectUrl) URL.revokeObjectURL(next[slotIndex].objectUrl);
      next[slotIndex] = {
        objectUrl: URL.createObjectURL(file),
        fileName: file.name,
      };
      return next;
    });
  }

  function clearSlot(slotIndex: number) {
    setSlots((prev) => {
      const next = [...prev];
      if (next[slotIndex].objectUrl) URL.revokeObjectURL(next[slotIndex].objectUrl);
      next[slotIndex] = { objectUrl: null, fileName: null };
      return next;
    });
  }

  function downloadSlot(slotIndex: number) {
    const slot = slots[slotIndex];
    if (!slot.objectUrl) return;
    const a = document.createElement("a");
    a.href = slot.objectUrl;
    a.download = slot.fileName ?? `asset-photo-${slotIndex + 1}.jpg`;
    a.click();
  }

  return (
    <div className="dashboard-stack" data-testid="f15-asset-images">
      <PrototypeBanner />

      <section className="dashboard-panel">
        <label className="field-inline">
          <span className="field-label">Sample asset</span>
          <select
            className="aims-select"
            value={asset?.aptoId ?? ""}
            onChange={(e) => {
              setAssetId(e.target.value);
              setSlots(emptySlots());
            }}
            data-testid="f15-asset-picker"
          >
            {F15_SAMPLE_ASSETS.map((a) => (
              <option key={a.aptoId} value={a.aptoId}>
                {a.aptoId} — {a.partNumber}
              </option>
            ))}
          </select>
        </label>
        {asset && (
          <p className="muted">
            {asset.serial} · {asset.accountName}
          </p>
        )}
      </section>

      <section className="dashboard-panel" aria-labelledby="f15-photos-title">
        <h2 id="f15-photos-title" className="panel-title">Photos (up to 3)</h2>
        <div className="f15-photo-grid">
          {slots.map((slot, index) => (
            <div key={index} className="f15-photo-slot" data-testid={`f15-photo-slot-${index}`}>
              <span className="field-label">Photo {index + 1}</span>
              {slot.objectUrl ? (
                <img
                  src={slot.objectUrl}
                  alt={`Asset photo ${index + 1}`}
                  className="f15-photo-preview"
                />
              ) : (
                <div className="f15-photo-placeholder">No photo</div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => onPickFile(index, e.target.files?.[0])}
                data-testid={`f15-photo-input-${index}`}
              />
              <div className="f15-photo-actions">
                {slot.objectUrl && (
                  <>
                    <AimsButton variant="secondary" onClick={() => clearSlot(index)}>
                      Delete
                    </AimsButton>
                    <AimsButton variant="secondary" onClick={() => downloadSlot(index)}>
                      Download
                    </AimsButton>
                  </>
                )}
                <AimsButton
                  variant="primary"
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>(
                      `[data-testid="f15-photo-input-${index}"]`,
                    );
                    input?.click();
                  }}
                >
                  {slot.objectUrl ? "Retake" : "Capture"}
                </AimsButton>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
