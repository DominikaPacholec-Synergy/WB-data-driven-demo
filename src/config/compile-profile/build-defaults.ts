import { statusOptions } from '@workflowbuilder/sdk';

import type { NodeConfig } from '../types/palette';
import { usesGeneralPreset } from './general-preset';

/**
 * The values a node opens with.
 */
export const buildDefaults = (node: NodeConfig) => {
  return {
    label: node.label,
    description: node.description,
    ...(usesGeneralPreset(node) ? { type: node.type, status: statusOptions.active.value } : {}),
    ...(node.defaults ?? {}),
  };
};
