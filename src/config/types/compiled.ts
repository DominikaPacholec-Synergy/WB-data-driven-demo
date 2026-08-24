import type {
  LayoutDirection,
  NodeSchema,
  PaletteItemOrGroup,
  UISchema,
  WorkflowBuilderEdge,
  WorkflowBuilderNode,
} from '@workflowbuilder/sdk';

import type { NodeConfig } from './palette';
import type { EditorProfile, ProfileId, ProfileMeta } from './profile';

export type CompiledProfile = {
  id: ProfileId;
  name: string;
  layoutDirection: LayoutDirection;
  nodeTypes: PaletteItemOrGroup[];
  initialNodes: WorkflowBuilderNode[];
  initialEdges: WorkflowBuilderEdge[];
  translations: ProfileMeta['translations'];
  nodeIndex: Map<string, NodeConfig>;
  source: EditorProfile;
};

export type CompiledNodeSchema = NodeSchema;
export type CompiledUiSchema = UISchema;
