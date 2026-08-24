import { statusOptions } from '@workflowbuilder/sdk';

import type { NodeConfig } from '../types/palette';

/**
 * A preset is a named bundle of ready-made panel parts that the compiler splices
 * into a node type, so `palette.json` does not hand-write the same
 * Title/Status/Description block once per node.
 */

export const usesGeneralPreset = (node: NodeConfig) => (node.ui?.preset ?? 'general') === 'general';

export const PRESET_PROPERTIES = {
  type: { type: 'string' },
  status: { type: 'string', options: Object.values(statusOptions) },
};
