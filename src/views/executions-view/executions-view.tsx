import { Icon, type WBIcon } from '@workflowbuilder/sdk';
import clsx from 'clsx';
import { useState } from 'react';

import { type Execution, useRunStore } from '@/run/store';
import primitives from '@/styles/primitives.module.css';

import styles from './executions-view.module.css';

import { StatusPill } from '../status-pill/status-pill';

const STEP_ICON: Record<string, { icon: WBIcon; tone: string }> = {
  done: { icon: 'CheckCircle', tone: 'ok' },
  running: { icon: 'CircleNotch', tone: 'info' },
  waiting: { icon: 'Clock', tone: 'warn' },
  rejected: { icon: 'XCircle', tone: 'danger' },
  skipped: { icon: 'MinusCircle', tone: 'muted' },
};

const ExecutionDetail = ({ execution }: { execution: Execution }) => {
  return (
    <section className={primitives['card']}>
      <header className={primitives['card-head']}>
        <div>
          <h2>
            {execution.workflowName} #{execution.id}
          </h2>
          <p className={primitives['card-sub']}>Started {execution.startedAt}</p>
        </div>
        <StatusPill value={execution.status} />
      </header>

      <div className={styles['timeline']}>
        <div>
          <h3>Steps</h3>
          <ol className={styles['steps']}>
            {execution.steps.map((step) => {
              const status = execution.nodeStatus[step.id];
              const view = status ? STEP_ICON[status] : null;
              return (
                <li key={step.id} data-tone={view?.tone ?? 'pending'}>
                  <Icon name={view?.icon ?? 'Circle'} size="small" />
                  <span>{step.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <h3>Audit log</h3>
          <ol className={styles['audit']}>
            {execution.log.map((entry, index) => (
              <li key={`${entry.at}-${index}`}>
                <time>{entry.at}</time>
                <span>
                  {entry.text}
                  {entry.detail ? <em>{entry.detail}</em> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export const ExecutionsView = ({ profileId }: { profileId: string }) => {
  const allIds = useRunStore((state) => state.order);
  const executions = useRunStore((state) => state.executions);
  const [openId, setOpenId] = useState<string | null>(null);

  /* Runs belong to the profile that started them — see the store's comment. */
  const order = allIds.filter((id) => executions[id].profileId === profileId);
  const stillVisible = openId && order.includes(openId) ? openId : undefined;
  const selectedId = stillVisible ?? order[0];
  const selected = selectedId ? executions[selectedId] : null;

  return (
    <div className={primitives['view']}>
      <header className={primitives['view-head']}>
        <h1>Executions</h1>
        <p className={primitives['view-sub']}>{order.length} run(s) in this session</p>
      </header>

      {order.length === 0 ? (
        <p className={primitives['empty']}>
          <Icon name="ListChecks" size="medium" />
          Nothing has run yet. Press “Run” in the builder.
        </p>
      ) : (
        <div className={primitives['view-split']}>
          <ul className={primitives['list']}>
            {order.map((id) => {
              const execution = executions[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={clsx(primitives['list-row'], {
                      [primitives['is-open']]: selectedId === id,
                    })}
                    onClick={() => setOpenId(id)}
                  >
                    <span className={primitives['list-main']}>
                      <strong>
                        {execution.workflowName} #{id}
                      </strong>
                      <span className={primitives['list-meta']}>
                        {execution.currentNodeId
                          ? `at ${
                              execution.steps.find((step) => step.id === execution.currentNodeId)
                                ?.label ?? execution.currentNodeId
                            }`
                          : `started ${execution.startedAt}`}
                      </span>
                    </span>
                    <StatusPill value={execution.status} />
                  </button>
                </li>
              );
            })}
          </ul>

          {selected ? <ExecutionDetail execution={selected} /> : null}
        </div>
      )}
    </div>
  );
};
