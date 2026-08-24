import { sharedProperties } from '@workflowbuilder/sdk';

import type { NodeConfig } from '../types/palette';
import { PRESET_PROPERTIES, usesGeneralPreset } from './general-preset';

export const buildSchema = (node: NodeConfig) => {
  return {
    type: 'object' as const,
    properties: {
      ...sharedProperties,
      ...(usesGeneralPreset(node) ? PRESET_PROPERTIES : {}),
      ...(node.properties ?? {}),
    },
    ...(node.required ? { required: node.required } : {}),
    ...(node.allOf ? { allOf: node.allOf } : {}),
  };
};
