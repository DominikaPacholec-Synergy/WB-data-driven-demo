/**
 * One status vocabulary for the whole shell, so a run reads the same on the
 * canvas, in the inbox and in the timeline. Consumes the `.status[data-tone]`
 * block in `app.css`, which in turn resolves to the SDK's chip tokens — a brand
 * edit in the Config Studio repaints these too.
 */

const TONES: Record<string, { tone: string; label: string }> = {
  // Execution statuses
  running: { tone: 'info', label: 'Running' },
  waiting: { tone: 'warn', label: 'Waiting for human' },
  completed: { tone: 'ok', label: 'Completed' },
  rejected: { tone: 'danger', label: 'Rejected' },
  failed: { tone: 'danger', label: 'Failed' },
  // Task statuses (`completed` / `rejected` are shared)
  pending: { tone: 'warn', label: 'Pending' },
};

export function StatusPill({ value }: { value: string }) {
  const view = TONES[value] ?? { tone: 'muted', label: value };
  return (
    <span className="status" data-tone={view.tone}>
      {view.label}
    </span>
  );
}
