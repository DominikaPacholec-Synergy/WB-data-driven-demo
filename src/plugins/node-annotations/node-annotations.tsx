import {
  Icon,
  type WBIcon,
  type WorkflowBuilderPlugin,
  getStoreNodes,
  registerComponentDecorator,
} from '@workflowbuilder/sdk';

import { lookupNodeConfig, useProvenanceStore } from '@/plugins/provenance';
import { type NodeRunStatus, useRunStore } from '@/run/store';

import styles from './node-annotations.module.css';

/**
 * Everything we add inside a node body
 */

const TONE: Record<NodeRunStatus, { tone: string; icon: WBIcon; label: string }> = {
  running: { tone: 'info', icon: 'CircleNotch', label: 'Running' },
  done: { tone: 'ok', icon: 'Check', label: 'Done' },
  waiting: { tone: 'warn', icon: 'UserFocus', label: 'Waiting for human' },
  rejected: { tone: 'danger', icon: 'X', label: 'Rejected' },
  skipped: { tone: 'muted', icon: 'Minus', label: 'Skipped' },
};

type SlotProps = { props: { nodeId: string } };

const NodeAnnotations = ({ props: { nodeId } }: SlotProps) => {
  const status = useRunStore((state) => {
    const execId = state.order[0];
    return execId ? state.executions[execId]?.nodeStatus[nodeId] : undefined;
  });
  const provenance = useProvenanceStore((state) => state.enabled);

  const view = status ? TONE[status] : null;

  const paletteType = provenance
    ? String(
        (getStoreNodes().find((node) => node.id === nodeId)?.data as { type?: unknown })?.type ??
          '',
      )
    : '';
  const config = paletteType ? lookupNodeConfig(paletteType) : undefined;

  if (!view && !provenance) return null;

  return (
    <>
      {view ? (
        <div className={styles['badge']} data-tone={view.tone}>
          <Icon name={view.icon} size="small" />
          <span>{view.label}</span>
        </div>
      ) : null}

      {provenance && paletteType ? (
        <div className={styles['origin']}>
          <code>palette.json › {paletteType}</code>
          {config ? <span>icon: {config.icon}</span> : <span>not in this palette</span>}
        </div>
      ) : null}
    </>
  );
};

let registered = false;

export const nodeAnnotationsPlugin: WorkflowBuilderPlugin = () => {
  if (registered) return;
  registered = true;

  registerComponentDecorator('OptionalNodeContent', {
    content: NodeAnnotations,
    place: 'after',
    name: 'node-annotations',
  });
};
