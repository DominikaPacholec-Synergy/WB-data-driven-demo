import type { PaletteItemOrGroup } from '@workflowbuilder/sdk';

import type { CompiledProfile } from '../types/compiled';
import type { NodeConfig } from '../types/palette';
import type { EditorProfile } from '../types/profile';
import { buildPaletteItem } from './build-palette-item';
import { compileInitialDiagram } from './compile-initial-diagram';
import { ProfileError } from './profile-error';

/**
 * Index the palette by node type, expand each entry into an SDK palette item,
 * compile the initial diagram against that index.
 */
export const compileProfile = (profile: EditorProfile): CompiledProfile => {
  const nodeIndex = new Map<string, NodeConfig>();

  const indexAndExpand = (node: NodeConfig) => {
    if (nodeIndex.has(node.type)) {
      throw new ProfileError(`Duplicate palette node type "${node.type}".`);
    }
    nodeIndex.set(node.type, node);
    return buildPaletteItem(node);
  };

  const nodeTypes: PaletteItemOrGroup[] = profile.palette.entries.map((entry) =>
    entry.kind === 'group'
      ? ({
          label: entry.label,
          isOpen: entry.isOpen ?? true,
          groupItems: entry.nodes.map(indexAndExpand),
        } as unknown as PaletteItemOrGroup)
      : indexAndExpand(entry),
  );

  const initialDiagram = compileInitialDiagram(profile.workflow.seed, nodeIndex);

  return {
    id: profile.id,
    name: profile.workflow.name,
    layoutDirection: profile.workflow.layoutDirection,
    nodeTypes,
    initialNodes: initialDiagram.nodes,
    initialEdges: initialDiagram.edges,
    translations: profile.translations,
    nodeIndex,
    source: profile,
  };
};
