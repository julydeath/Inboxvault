import type { ScanJobSummary } from "@/lib/types";
import { Icon } from "./icon";

export function ScanActivity({
  job,
  busy,
  enabled,
  connected,
  onRun,
}: {
  job: ScanJobSummary;
  busy: boolean;
  enabled: boolean;
  connected: boolean;
  onRun: () => void;
}) {
  const complete = job.status === "completed";
  return (
    <section
      className={`scan-activity ${busy ? "is-scanning" : ""}`}
      aria-label="Latest scan"
    >
      <div className="scan-activity-icon">
        <Icon name={complete ? "check" : "scan"} size={25} />
      </div>
      <div className="scan-activity-main">
        <div className="scan-activity-title">
          <h3>
            {busy
              ? "Finding your attachments…"
              : complete
                ? "A little more organized."
                : job.status === "failed"
                  ? "Your scan needs another try."
                  : "Your next batch is ready."}
          </h3>
          <span className={`status-pill status-${job.status}`}>
            {busy ? "Processing" : job.status}
          </span>
        </div>
        <p>
          {job.processed.toLocaleString()} messages checked <span>·</span>{" "}
          {job.found.toLocaleString()} attachments found
        </p>
        <code>{job.query}</code>
        {job.error && <p className="error-text">{job.error}</p>}
        {busy && (
          <div
            className="indeterminate-progress"
            aria-label="Processing up to ten messages"
          >
            <span />
          </div>
        )}
      </div>
      {!complete && (
        <button
          className="button button-violet"
          disabled={busy || !enabled || !connected}
          onClick={onRun}
        >
          {busy
            ? "Processing…"
            : job.status === "failed"
              ? "Retry batch"
              : "Process 10 messages"}
          <Icon name="arrow" size={16} />
        </button>
      )}
    </section>
  );
}
