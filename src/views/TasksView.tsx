import { useState } from 'react';
import { Icon } from '@workflowbuilder/sdk';

import type { RunFact } from '../config/types';
import { resolveTask } from '../run/engine';
import { useRunStore, type Task } from '../run/store';
import { StatusPill } from './StatusPill';
import { formatMoney } from './format';

/**
 * The human's side of the workflow.
 *
 * This is the screen that makes "human in the loop" concrete: the run is parked,
 * and nothing moves until someone here decides. The task's assignee, priority,
 * deadline and whether Reject is even offered all come from the Human Approval
 * node's properties — i.e. from `palette.json` plus whatever was edited on the
 * canvas.
 */

/** Renders one configured fact against the run context. */
function factValue(fact: RunFact, context: Record<string, unknown> | undefined): string {
  const raw = context?.[fact.key];
  if (fact.format === 'money') {
    return formatMoney(raw, String(context?.[fact.currencyKey ?? ''] ?? 'EUR'));
  }
  if (fact.format === 'flag') {
    return raw ? (fact.trueText ?? 'Yes') : (fact.falseText ?? 'No');
  }
  return raw === undefined || raw === null || raw === '' ? '—' : String(raw);
}

function TaskDetail({
  task,
  facts,
  onClose,
}: {
  task: Task;
  facts: RunFact[];
  onClose: () => void;
}) {
  const [comment, setComment] = useState('');
  const context = useRunStore((state) => state.executions[task.execId]?.context);
  const pending = task.status === 'pending';

  const decide = (decision: 'approve' | 'reject') => {
    resolveTask(task.id, decision, comment);
    onClose();
  };

  return (
    <section className="card task-detail">
      <header className="card__head">
        <div>
          <h2>{task.title}</h2>
          <p className="card__sub">Assigned to {task.assignee}</p>
        </div>
        <StatusPill value={task.status} />
      </header>

      {/* Rows, labels, formatting and order all come from `profile.run.facts`. */}
      <dl className="facts">
        {facts.map((fact) => (
          <div key={fact.key}>
            <dt>{fact.label}</dt>
            <dd className={fact.strong ? 'facts__strong' : undefined}>
              {factValue(fact, context)}
            </dd>
          </div>
        ))}
        <div>
          <dt>Priority</dt>
          <dd>{task.priority}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>within {task.dueAfterHours}h</dd>
        </div>
      </dl>

      {task.reviewerNote ? <p className="task-detail__note">{task.reviewerNote}</p> : null}

      {pending ? (
        <>
          <label className="field">
            <span>Comment</span>
            <textarea
              rows={3}
              value={comment}
              placeholder="Optional — it lands in the execution timeline."
              onChange={(event) => setComment(event.currentTarget.value)}
            />
          </label>
          <footer className="card__actions">
            {/* Whether Reject exists at all is a property of the node. */}
            {task.allowReject ? (
              <button type="button" className="btn btn--danger" onClick={() => decide('reject')}>
                Reject
              </button>
            ) : null}
            <button type="button" className="btn btn--primary" onClick={() => decide('approve')}>
              Approve
            </button>
          </footer>
        </>
      ) : (
        <p className="card__sub">
          {task.status === 'completed' ? 'Approved' : 'Rejected'}
          {task.comment?.trim() ? ` — “${task.comment.trim()}”` : ''}
        </p>
      )}
    </section>
  );
}

export function TasksView({ profileId, facts }: { profileId: string; facts: RunFact[] }) {
  const allTaskIds = useRunStore((state) => state.taskOrder);
  const tasks = useRunStore((state) => state.tasks);
  const [openId, setOpenId] = useState<string | null>(null);

  /* Each profile is its own application; it must not see the other's inbox. */
  const taskOrder = allTaskIds.filter((id) => tasks[id].profileId === profileId);
  const open = openId && tasks[openId]?.profileId === profileId ? tasks[openId] : null;

  return (
    <div className="view">
      <header className="view__head">
        <h1>My Tasks</h1>
        <p className="view__sub">
          {taskOrder.filter((id) => tasks[id].status === 'pending').length} waiting for a decision
        </p>
      </header>

      {taskOrder.length === 0 ? (
        <p className="empty">
          <Icon name="Tray" size="medium" />
          No tasks yet. Start a run in the builder — the workflow will pause here.
        </p>
      ) : (
        <div className="view__split">
          <ul className="list">
            {taskOrder.map((id) => {
              const task = tasks[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`list__row${openId === id ? ' is-open' : ''}`}
                    onClick={() => setOpenId(id)}
                  >
                    <span className="list__main">
                      <strong>{task.title}</strong>
                      <span className="list__meta">
                        {task.assignee} · due within {task.dueAfterHours}h
                      </span>
                    </span>
                    <StatusPill value={task.status} />
                  </button>
                </li>
              );
            })}
          </ul>

          {open ? (
            <TaskDetail task={open} facts={facts} onClose={() => setOpenId(open.id)} />
          ) : (
            <p className="empty">Pick a task to see the invoice and decide.</p>
          )}
        </div>
      )}
    </div>
  );
}
