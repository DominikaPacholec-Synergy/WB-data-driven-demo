import {
  generalInformation,
  globalControls,
  sharedProperties,
  statusOptions,
  type PaletteItem,
  type PaletteItemOrGroup,
  type TemplateModel,
  type WorkflowBuilderEdge,
  type WorkflowBuilderNode,
} from '@workflowbuilder/sdk';

import type {
  CompiledProfile,
  EditorProfile,
  NodeConfig,
  Seed,
  SeedEdge,
  SeedNode,
} from './types';

export class ProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileError';
  }
}

/* ------------------------------------------------------------------ nodes */

const usesGeneralPreset = (node: NodeConfig) => (node.ui?.preset ?? 'general') === 'general';

/**
 * Two fields the SDK's `generalInformation` accordion needs but that
 * `sharedProperties` does not supply:
 *
 * - `status` — the accordion binds a Select to `#/properties/status`. Note the
 *   options must live on the SCHEMA, not on the uischema element: the SDK's
 *   Select renderer reads `schema.options`.
 * - `type` — the accordion carries `rule: { effect: 'SHOW', condition: { scope:
 *   '#', schema: { required: ['type'] } } }`, so it stays hidden unless the form
 *   data has a `type` field. Without it the whole Title/Status/Description block
 *   silently never renders.
 */
const PRESET_PROPERTIES = {
  type: { type: 'string' },
  status: { type: 'string', options: Object.values(statusOptions) },
};

/**
 * Splices the SDK's own `sharedProperties` under the config's fields, so every
 * node type is guaranteed to declare the mandatory `label` + `description`
 * properties without the config author having to remember them.
 */
function buildSchema(node: NodeConfig) {
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
}

/**
 * `generalInformation` is the SDK's ready-made Title/Status/Description
 * accordion and `globalControls` its shared footer controls. Reusing both means
 * every node gets a consistent panel for free — from the SDK, not from us.
 */
function buildUiSchema(node: NodeConfig) {
  const preset = node.ui?.preset ?? 'general';
  const elements: unknown[] = [
    ...(preset === 'general' ? [generalInformation] : []),
    ...(node.ui?.elements ?? []),
    ...(node.ui?.globalControls === false ? [] : globalControls),
  ];
  return { type: 'VerticalLayout', elements };
}

function buildDefaults(node: NodeConfig) {
  return {
    label: node.label,
    description: node.description,
    ...(usesGeneralPreset(node) ? { type: node.type, status: statusOptions.active.value } : {}),
    ...(node.defaults ?? {}),
  };
}

export function buildPaletteItem(node: NodeConfig): PaletteItem {
  return {
    type: node.type,
    label: node.label,
    description: node.description,
    icon: node.icon,
    ...(node.templateType ? { templateType: node.templateType } : {}),
    schema: buildSchema(node),
    uischema: buildUiSchema(node),
    defaultPropertiesData: buildDefaults(node),
    ...(node.outputSchema ? { outputSchema: node.outputSchema } : {}),
  } as unknown as PaletteItem;
}

/* ------------------------------------------------------------------- seed */

/**
 * Mirrors the SDK's own palette-drop factory exactly (verified against
 * `dist/index-*.js`):
 *
 *   node.type = customTemplates[paletteType] ? paletteType : templateType
 *   node.data = { segments: [], properties, type, icon }
 *
 * We register no custom node templates, so `node.type` is always the
 * `templateType`. Note the SDK does NOT copy `templateType` into `data`.
 */
function buildNode(seed: SeedNode, index: Map<string, NodeConfig>): WorkflowBuilderNode {
  const def = index.get(seed.nodeType);
  if (!def) {
    throw new ProfileError(
      `Seed node "${seed.id}" references unknown palette type "${seed.nodeType}". ` +
        `Known types: ${[...index.keys()].join(', ')}`,
    );
  }
  return {
    id: seed.id,
    type: def.templateType ?? 'node',
    position: seed.position,
    data: {
      segments: [],
      type: def.type,
      icon: def.icon,
      properties: { ...buildDefaults(def), ...(seed.properties ?? {}) },
    },
  } as unknown as WorkflowBuilderNode;
}

/** Inner handle ids look like `source:inner:<branchId>` — see `getHandleId()`. */
function buildEdge(edge: SeedEdge): WorkflowBuilderEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'labelEdge',
    ...(edge.sourceBranch ? { sourceHandle: `source:inner:${edge.sourceBranch}` } : {}),
    ...(edge.label || edge.icon
      ? { data: { ...(edge.label ? { label: edge.label } : {}), ...(edge.icon ? { icon: edge.icon } : {}) } }
      : {}),
  } as unknown as WorkflowBuilderEdge;
}

function compileSeed(seed: Seed, index: Map<string, NodeConfig>) {
  return {
    nodes: seed.nodes.map((n) => buildNode(n, index)),
    edges: seed.edges.map(buildEdge),
  };
}

/* ---------------------------------------------------------------- profile */

export function compileProfile(profile: EditorProfile): CompiledProfile {
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

  const diagramTemplates: TemplateModel[] = (profile.workflow.templates ?? []).map((template) => ({
    id: template.id,
    name: template.name,
    icon: template.icon,
    value: {
      name: template.name,
      layoutDirection: template.layoutDirection ?? profile.workflow.layoutDirection,
      diagram: {
        ...compileSeed(template.seed, nodeIndex),
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    },
  })) as unknown as TemplateModel[];

  return {
    id: profile.id,
    name: profile.workflow.name,
    layoutDirection: profile.workflow.layoutDirection,
    nodeTypes,
    initialNodes: main.nodes,
    initialEdges: main.edges,
    diagramTemplates,
    translations: profile.translations,
    nodeIndex,
    source: profile,
  };
}
