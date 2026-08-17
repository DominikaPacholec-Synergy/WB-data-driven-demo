import {
  Icon,
  getStoreNodes,
  registerComponentDecorator,
  type WBIcon,
  type WorkflowBuilderPlugin,
} from '@workflowbuilder/sdk';

import { useRunStore, type NodeRunStatus } from '../run/store';
import { lookupNodeConfig, useProvenanceStore } from './provenance';

/**
 * Everything we add inside a node body, mounted on the SDK's
 * `OptionalNodeContent` slot: the run-status badge and the provenance label.
 *
 * ~60 generic lines and no forked node template, so the four built-in
 * `templateType` looks stay intact.
 *
 * Known limitation: the `ai-node` template does not render this slot — its body
 * is taken by the AI-tools control — so AI nodes show no badge.
 */

const TONE: Record<NodeRunStatus, { tone: string; icon: WBIcon; label: string }> = {
  running: { tone: 'info', icon: 'CircleNotch', label: 'Running' },
  done: { tone: 'ok', icon: 'Check', label: 'Done' },
  waiting: { tone: 'warn', icon: 'UserFocus', label: 'Waiting for human' },
  rejected: { tone: 'danger', icon: 'X', label: 'Rejected' },
  skipped: { tone: 'muted', icon: 'Minus', label: 'Skipped' },
};

/**
 * A decorator's `content` does NOT receive the host component's props directly.
 * The SDK renders it as `content({ props })` — the host props arrive nested
 * under a single `props` key (verified in `dist/index-*.js`; the public type is
 * only `ElementType`, so nothing in the `.d.ts` tells you this). Destructuring
 * `nodeId` at the top level silently yields `undefined` and nothing shows.
 */
type SlotProps = { props: { nodeId: string } };

function NodeAnnotations({ props: { nodeId } }: SlotProps) {
  /*
   * Both selectors MUST return scalars. Returning an object would mint a new
   * identity on every store notification and loop the render.
   */
  const status = useRunStore((state) => {
    const execId = state.order[0];
    return execId ? state.executions[execId]?.nodeStatus[nodeId] : undefined;
  });
  const provenance = useProvenanceStore((state) => state.enabled);

  const view = status ? TONE[status] : null;

  /*
   * Read the palette type from the store on demand. It is not reactive, but a
   * node's type never changes after it is dropped, so there is nothing to
   * subscribe to — and subscribing to the SDK store here would be a render loop
   * waiting to happen.
   */
  const paletteType = provenance
    ? String(
        (getStoreNodes().find((node) => node.id === nodeId)?.data as { type?: unknown })?.type ?? '',
      )
    : '';
  const config = paletteType ? lookupNodeConfig(paletteType) : undefined;

  if (!view && !provenance) return null;

  return (
    <>
      {view ? (
        <div className="node-badge" data-tone={view.tone}>
          <Icon name={view.icon} size="small" />
          <span>{view.label}</span>
        </div>
      ) : null}

      {provenance && paletteType ? (
        <div className="node-origin">
          <code>palette.json › {paletteType}</code>
          {config ? <span>icon: {config.icon}</span> : <span>not in this palette</span>}
        </div>
      ) : null}
    </>
  );
}

/**
 * Module-level guard. `plugins` run on every `<Root>` mount and StrictMode
 * mounts twice, so without this the slot collects duplicates. The SDK also
 * dedupes by `name`, but we should not rely on two mechanisms for one rule.
 */
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
