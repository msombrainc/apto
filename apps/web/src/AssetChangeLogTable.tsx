import type { Asset } from "./api";

type Props = {
  entries: Asset["changeLog"];
};

export function AssetChangeLogTable({ entries }: Props) {
  return (
    <>
      <table className="change-log-table" aria-label="Asset change log">
        <thead>
          <tr>
            <th>Field</th>
            <th>Old</th>
            <th>New</th>
            <th>User</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={`${e.fieldName}-${e.changedAtUtc}-${i}`}>
              <td>{e.fieldName}</td>
              <td>{e.oldValue ?? "—"}</td>
              <td>{e.newValue ?? "—"}</td>
              <td>{e.changedBy}</td>
              <td>{new Date(e.changedAtUtc).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length === 0 && <p className="muted">No changes logged yet.</p>}
    </>
  );
}
