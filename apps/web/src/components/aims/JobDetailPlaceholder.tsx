import { Link } from "react-router-dom";
import { ROUTES } from "../../routing/paths";
type JobDetailPlaceholderProps = {
  jobId: string;
};

export function JobDetailPlaceholder({ jobId }: JobDetailPlaceholderProps) {
  return (
    <div className="dashboard-panel" data-testid="job-detail-placeholder">
      <h2 className="panel-title">Job detail</h2>
      <p className="panel-subtitle">
        Full job detail (F3) is tracked on apto#53. Job ID: <code>{jobId}</code>
      </p>
      <Link to={ROUTES.jobs} className="aims-button aims-button--secondary">
        Back to jobs list
      </Link>
    </div>
  );
}
