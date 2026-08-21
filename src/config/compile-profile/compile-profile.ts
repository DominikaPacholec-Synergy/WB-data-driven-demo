import type { PaletteItemOrGroup } from '@workflowbuilder/sdk';

import type { CompiledProfile } from '../types/compiled';
import type { NodeConfig } from '../types/palette';
import type { EditorProfile } from '../types/profile';
import { buildPaletteItem } from './build-palette-item';
import { compileSeed } from './compile-seed';
import { ProfileError } from './profile-error';

/**
 * The compiler's entry point, and the only file in this folder the rest of the
 * app imports.
 *
 * It orchestrates and nothing else: index the palette by node type, expand each
 * entry into an SDK palette item, compile the seed diagram against that index.
 * Every expansion rule lives in a sibling file named after it.
 */
export const compileProfile = (profile: EditorProfile): CompiledProfile => {
  const nodeIndex = new Map<string, NodeConfig>();

  const remember = (node: NodeConfig) => {
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
          groupItems: entry.nodes.map(remember),
        } as unknown as PaletteItemOrGroup)
      : remember(entry),
  );

  const main = compileSeed(profile.workflow.seed, nodeIndex);

  return {
    id: profile.id,
    name: profile.workflow.name,
    layoutDirection: profile.workflow.layoutDirection,
    nodeTypes,
    initialNodes: main.nodes,
    initialEdges: main.edges,
    translations: profile.translations,
    nodeIndex,
    source: profile,
  };
};
