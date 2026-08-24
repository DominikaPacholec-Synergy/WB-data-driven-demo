import { Icon, type WBIcon } from '@workflowbuilder/sdk';
import { useMemo } from 'react';

import { Dropdown, type DropdownOption } from '@/components/dropdown/dropdown';
import { Tooltip } from '@/components/tooltip/tooltip';
import { type Execution, useRunStore } from '@/run/store';
import { StatusPill } from '@/views/status-pill/status-pill';

import styles from './run-tracker.module.css';

const OPTION_ICON: Record<string, WBIcon> = {
  running: 'CircleNotch',
  waiting: 'UserFocus',
  completed: 'CheckCircle',
  rejected: 'XCircle',
  failed: 'Warning',
};

/** Open == still going somewhere: it can still change the badges you see. */
const isOpen = (execution: Execution): boolean =>
  execution.status === 'running' || execution.status === 'waiting';

const position = (execution: Execution): string => {
  if (!execution.currentNodeId) return `started ${execution.startedAt}`;
  const step = execution.steps.find((candidate) => candidate.id === execution.currentNodeId);
  return `at ${step?.label ?? execution.currentNodeId}`;
};

export const RunTracker = ({ profileId }: { profileId: string }) => {
  const order = useRunStore((state) => state.order);
  const executions = useRunStore((state) => state.executions);
  const trackedExecId = useRunStore((state) => state.trackedExecId);
  const trackExecution = useRunStore((state) => state.trackExecution);

  const runs = useMemo(
    () => order.map((id) => executions[id]).filter((run) => run?.profileId === profileId),
    [order, executions, profileId],
  );

  const options = useMemo<DropdownOption[]>(
    () =>
      runs.map((run) => ({
        value: run.id,
        label: `#${run.id} - ${position(run)}`,
        icon: OPTION_ICON[run.status],
      })),
    [runs],
  );

  if (!runs.length) return null;

  const tracked = trackedExecId ? executions[trackedExecId] : undefined;
  const openCount = runs.filter(isOpen).length;

  return (
    <div className={styles['tracker']}>
      <span className={styles['label']}>Tracking</span>

      <Tooltip
        label="Execution shown on the diagram"
        description="Node badges belong to this run only. Pick another to replay its state on the same diagram."
        align="start"
      >
        <Dropdown
          size="small"
          value={tracked?.id ?? null}
          options={options}
          onChange={trackExecution}
          placeholder="Nothing tracked"
          aria-label="Execution shown on the diagram"
        />
      </Tooltip>

      {tracked ? <StatusPill value={tracked.status} /> : null}

      {openCount > 1 ? (
        <Tooltip
          label={`${openCount} runs are open`}
          description="A node can only wear one badge, so the other runs are live but off-screen. Switch to one to see it."
          align="start"
        >
          <span className={styles['open-runs']}>
            <Icon name="Stack" size="medium" />
            {openCount} open runs
          </span>
        </Tooltip>
      ) : null}
    </div>
  );
};
