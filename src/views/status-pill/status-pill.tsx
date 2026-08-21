import styles from './status-pill.module.css';

const TONES: Record<string, { tone: string; label: string }> = {
  // Execution statuses
  running: { tone: 'info', label: 'Running' },
  waiting: { tone: 'warn', label: 'Waiting for human' },
  completed: { tone: 'ok', label: 'Completed' },
  rejected: { tone: 'danger', label: 'Rejected' },
  failed: { tone: 'danger', label: 'Failed' },
  pending: { tone: 'warn', label: 'Pending' },
};

type Props = {
  value: string;
};

export const StatusPill = ({ value }: Props) => {
  const view = TONES[value] ?? { tone: 'muted', label: value };
  return (
    <span className={styles['status']} data-tone={view.tone}>
      {view.label}
    </span>
  );
};
