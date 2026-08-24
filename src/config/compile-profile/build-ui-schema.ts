import { generalInformation, globalControls } from '@workflowbuilder/sdk';

import type { NodeConfig } from '../types/palette';
import { usesGeneralPreset } from './general-preset';
import { withResolvedCaptions } from './with-resolved-captions';

export const buildUiSchema = (node: NodeConfig) => {
  const properties = node.properties ?? {};
  const elements: unknown[] = [
    ...(usesGeneralPreset(node) ? [generalInformation] : []),
    ...(node.ui?.elements ?? []).map((element) => withResolvedCaptions(element, properties)),
    ...(node.ui?.globalControls === false ? [] : globalControls),
  ];
  return { type: 'VerticalLayout', elements };
};
