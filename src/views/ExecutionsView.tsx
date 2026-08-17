import { useState } from 'react';
import { Icon, type WBIcon } from '@workflowbuilder/sdk';

import { useRunStore, type Execution } from '../run/store';
import { StatusPill } from './StatusPill';

/**
 * "What is happening with this particular run?" — as opposed to the builder,
 * which answers "how should the workflow work?".
 *
 * The step list and the audit log are the two halves that explain durable
 * execution visually: a run can sit at `Waiting for human` indefinitely, and the
 * timeline shows both the gap and what resumed it.
 */

const STEP_ICON: Record<string, { icon: WBIcon; tone: string }> = {
  done: { icon: 'CheckCircle', tone: 'ok' },
  running: { icon: 'CircleNotch', tone: 'info' },
  waiting: { icon: 'Clock', tone: 'warn' },
  rejected: { icon: 'XCircle', tone: 'danger' },
  skipped: { icon: 'MinusCircle', tone: 'muted' },
};

function ExecutionDetail({ execution }: { execution: Execution }) {
  return (
    <section className="card">
      <header className="card__head">
        <div>
          <h2>
            {execution.workflowName} #{execution.id}
          </h2>
          <p className="card__sub">Started {execution.startedAt}</p>
        </div>
        <StatusPill value={execution.status} />
      </header>

      <div className="timeline">
        <div>
          <h3>Steps</h3>
          <ol className="steps">
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
          <ol className="audit">
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
}

export function ExecutionsView({ profileId }: { profileId: string }) {
  const allIds = useRunStore((state) => state.order);
  const executions = useRunStore((state) => state.executions);
  const [openId, setOpenId] = useState<string | null>(null);

  /* Runs belong to the profile that started them — see the store's comment. */
  const order = allIds.filter((id) => executions[id].profileId === profileId);
  const stillVisible = openId && order.includes(openId) ? openId : undefined;
  const selectedId = stillVisible ?? order[0];
  const selected = selectedId ? executions[selectedId] : null;

  return (
    <div className="view">
      <header className="view__head">
        <h1>Executions</h1>
        <p className="view__sub">{order.length} run(s) in this session</p>
      </header>

      {order.length === 0 ? (
        <p className="empty">
          <Icon name="ListChecks" size="medium" />
          Nothing has run yet. Press “Run” in the builder.
        </p>
      ) : (
        <div className="view__split">
          <ul className="list">
            {order.map((id) => {
              const execution = executions[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`list__row${selectedId === id ? ' is-open' : ''}`}
                    onClick={() => setOpenId(id)}
                  >
                    <span className="list__main">
                      <strong>
                        {execution.workflowName} #{id}
                      </strong>
                      <span className="list__meta">
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
}
