import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { lookupAssetByCode } from "../../api";
import { inventoryAssetPath } from "../../routing/paths";

type GlobalAssetLookupProps = {
  onError: (message: string | null) => void;
};

export function GlobalAssetLookup({ onError }: GlobalAssetLookupProps) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    onError(null);
    try {
      const result = await lookupAssetByCode(trimmed);
      navigate(inventoryAssetPath(result.id));
      setCode("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Asset lookup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="global-asset-lookup" onSubmit={(e) => void onSubmit(e)} aria-label="Global asset lookup">
      <label className="global-asset-lookup-label" htmlFor="f1-global-asset-lookup">
        Find asset
      </label>
      <input
        id="f1-global-asset-lookup"
        data-testid="f1-global-asset-lookup"
        type="search"
        className="global-asset-lookup-input"
        placeholder="Apto ID or serial"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={busy}
        autoComplete="off"
      />
    </form>
  );
}
