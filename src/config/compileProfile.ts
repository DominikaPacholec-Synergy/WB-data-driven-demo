import {
  generalInformation,
  globalControls,
  sharedProperties,
  statusOptions,
  type PaletteItem,
  type PaletteItemOrGroup,
  type WorkflowBuilderEdge,
  type WorkflowBuilderNode,
} from '@workflowbuilder/sdk';

import type {
  CompiledProfile,
  EditorProfile,
  FieldSchemaConfig,
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
const buildSchema = (node: NodeConfig) => {
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

/* --------------------------------------------------------------- captions */

/**
 * Which uischema types render through the SDK's shared control wrapper.
 *
 * That wrapper is the ONLY place a field caption is produced, and it reads
 * `uischema.label` — NOT the schema property. The SDK's own
 * `generalInformation` preset sets its labels exactly that way.
 *
 * `MessageOnError` is deliberately absent: it goes through the same wrapper, so
 * a label there would print the field's caption above the warning text.
 * `AiTools`, `DecisionBranches` and `DynamicConditions` render their own header.
 */
const LABELLED_CONTROLS = new Set([
  'Text',
  'TextArea',
  'Select',
  'Switch',
  'DatePicker',
  'VariableText',
  'VariableTextArea',
]);

/** The only scope shape either profile uses. Anything else is left alone. */
const SCOPE_PREFIX = '#/properties/';

/** The little of a uischema element this pass needs to see. */
type UiElement = {
  type?: unknown;
  scope?: unknown;
  label?: unknown;
  placeholder?: unknown;
  elements?: unknown[];
};

/**
 * Copies a field's configured `label` and `placeholder` from the schema property
 * onto its uischema element, so both are declared ONCE — next to the property,
 * where `options` and `minimum` already live. Without this the SDK silently
 * renders every config-driven field with no caption at all, which on a Switch
 * leaves a bare toggle that says nothing.
 *
 * `placeholder` rides along because the SDK splits the same way: its `Select`
 * reads `schema.placeholder`, but `Text` / `TextArea` / `VariableText*` read the
 * uischema element — so a schema-side placeholder reached only half the controls.
 *
 * Recursive: controls sit inside an `Accordion`, sometimes inside a nested
 * `HorizontalLayout`. Whatever the element already states wins — per key — so a
 * config can still override one placement's wording without moving the rest.
 */
const withResolvedCaptions = (
  element: unknown,
  properties: Record<string, FieldSchemaConfig>,
): unknown => {
  if (element === null || typeof element !== 'object') return element;
  const el = element as UiElement;

  const walked = Array.isArray(el.elements)
    ? { ...el, elements: el.elements.map((child) => withResolvedCaptions(child, properties)) }
    : el;

  if (typeof el.type !== 'string' || !LABELLED_CONTROLS.has(el.type)) return walked;
  if (typeof el.scope !== 'string' || !el.scope.startsWith(SCOPE_PREFIX)) return walked;

  const field = properties[el.scope.slice(SCOPE_PREFIX.length)];
  const inherit = (key: 'label' | 'placeholder') =>
    el[key] === undefined && typeof field?.[key] === 'string' ? { [key]: field[key] } : {};

  return { ...walked, ...inherit('label'), ...inherit('placeholder') };
};

/**
 * `generalInformation` is the SDK's ready-made Title/Status/Description
 * accordion and `globalControls` its shared footer controls. Reusing both means
 * every node gets a consistent panel for free — from the SDK, not from us.
 *
 * Only the config's own elements go through `withResolvedCaptions`; the two SDK
 * fragments already carry the captions they want.
 */
const buildUiSchema = (node: NodeConfig) => {
  const preset = node.ui?.preset ?? 'general';
  const properties = node.properties ?? {};
  const elements: unknown[] = [
    ...(preset === 'general' ? [generalInformation] : []),
    ...(node.ui?.elements ?? []).map((element) => withResolvedCaptions(element, properties)),
    ...(node.ui?.globalControls === false ? [] : globalControls),
  ];
  return { type: 'VerticalLayout', elements };
};

const buildDefaults = (node: NodeConfig) => {
  return {
    label: node.label,
    description: node.description,
    ...(usesGeneralPreset(node) ? { type: node.type, status: statusOptions.active.value } : {}),
    ...(node.defaults ?? {}),
  };
};

export const buildPaletteItem = (node: NodeConfig): PaletteItem => {
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
};

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
const buildNode = (seed: SeedNode, index: Map<string, NodeConfig>): WorkflowBuilderNode => {
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
};

/** Inner handle ids look like `source:inner:<branchId>` — see `getHandleId()`. */
const buildEdge = (edge: SeedEdge): WorkflowBuilderEdge => {
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
};

const compileSeed = (seed: Seed, index: Map<string, NodeConfig>) => {
  return {
    nodes: seed.nodes.map((n) => buildNode(n, index)),
    edges: seed.edges.map(buildEdge),
  };
};

/* ---------------------------------------------------------------- profile */

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
