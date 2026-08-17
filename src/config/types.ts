import type {
  IfThenElseSchema,
  LayoutDirection,
  NodeSchema,
  PaletteItemOrGroup,
  PluginTranslationResource,
  TemplateModel,
  UISchema,
  WorkflowBuilderEdge,
  WorkflowBuilderNode,
} from '@workflowbuilder/sdk';

/**
 * The editor is described by data. This file is the contract for that data.
 *
 * Nothing here is a React value: an "editor profile" is JSON all the way down,
 * so it can be served by a backend and swapped at runtime without touching code.
 */

/* ------------------------------------------------------------------ index */

export type ProfileId = string;

export type ProfileIndexEntry = {
  id: ProfileId;
  label: string;
  description: string;
  /** A WBIcon name. Kept as a plain string so config files stay pure JSON. */
  icon: string;
};

export type ProfileIndex = { profiles: ProfileIndexEntry[] };

/* ------------------------------------------------------------------ theme */

export type ThemeMode = 'light' | 'dark';

/**
 * Keys are the SDK's REAL custom-property names (`--ax-colors-acc1-500`,
 * `--wb-font-family`, ...). We deliberately invent no aliases: the config must
 * name the design system's own API, or the demo proves nothing.
 */
export type TokenMap = Record<string, string>;

export type TokenControl = {
  /** Shown verbatim in the UI — that is the point. */
  token: string;
  label: string;
  /** `base` = mode-independent; `mode` = edits the active light/dark map. */
  bucket: 'base' | 'mode';
} & (
  | { kind: 'color' }
  | { kind: 'length'; unit: 'px' | 'rem'; min: number; max: number; step: number }
  | { kind: 'choice'; options: { label: string; value: string }[] }
);

export type TokenControlGroup = { label: string; controls: TokenControl[] };

export type ThemeConfig = {
  defaultMode: ThemeMode;
  /** `--ax-colors-*`, `--ax-primitive-*`, `--ax-token-*`, `--ax-public-*`, `--wb-*` */
  base: TokenMap;
  /** The 174 mode-scoped semantics, declared on `html[data-theme=...]`. */
  light: TokenMap;
  dark: TokenMap;
  /** Which tokens the Config Studio exposes as live controls. */
  inspector: TokenControlGroup[];
};

/* ---------------------------------------------------------------- palette */

/**
 * Loose passthrough for a single field's JSON Schema. The SDK's `FieldSchema`
 * union is narrower than what is comfortable to author by hand, and the SDK
 * validates at runtime anyway, so we keep this permissive on purpose.
 */
export type FieldSchemaConfig = Record<string, unknown>;

/**
 * Compact authoring format for a node type.
 *
 * Deliberately NOT `PaletteItem`. `compileProfile()` expands it, splicing in the
 * SDK's own exported `sharedProperties` / `generalInformation` / `globalControls`
 * so that the mandatory `label` + `description` properties can never be
 * forgotten — the exact mistake the previous hand-written configs made.
 */
export type NodeConfig = {
  type: string;
  label: string;
  description: string;
  /** WBIcon name, e.g. "Invoice", "Robot", "SealCheck". */
  icon: string;
  /**
   * Selects one of four built-in node looks. Also becomes the ReactFlow
   * `node.type` of seeded nodes, since we register no custom templates.
   */
  templateType?: 'node' | 'start-node' | 'ai-node' | 'decision-node';
  /** Merged ON TOP of the SDK's `sharedProperties`. */
  properties?: Record<string, FieldSchemaConfig>;
  required?: string[];
  /** Conditional validation, passed through verbatim. */
  allOf?: IfThenElseSchema[];
  ui?: {
    /** `general` prepends the SDK's ready-made Title/Status/Description accordion. */
    preset?: 'general' | 'none';
    elements: unknown[];
    /** Defaults to true — appends the SDK's `globalControls`. */
    globalControls?: boolean;
  };
  defaults?: Record<string, unknown>;
  outputSchema?: unknown;
};

export type PaletteEntryConfig =
  | { kind: 'group'; label: string; isOpen?: boolean; nodes: NodeConfig[] }
  | ({ kind: 'node' } & NodeConfig);

export type PaletteConfig = { entries: PaletteEntryConfig[] };

/* --------------------------------------------------------------- workflow */

/**
 * References a palette `type`. `icon`, `templateType` and defaults are
 * INHERITED at compile time, never duplicated in the seed.
 */
export type SeedNode = {
  id: string;
  nodeType: string;
  position: { x: number; y: number };
  properties?: Record<string, unknown>;
};

export type SeedEdge = {
  id: string;
  source: string;
  target: string;
  /**
   * Id of a `decisionBranches[]` entry on the source node. Compiled into
   * `sourceHandle: "source:inner:<branchId>"`.
   */
  sourceBranch?: string;
  label?: string;
  icon?: string;
};

export type Seed = { nodes: SeedNode[]; edges: SeedEdge[] };

export type DiagramTemplateConfig = {
  id: number;
  name: string;
  icon: string;
  layoutDirection?: LayoutDirection;
  seed: Seed;
};

export type WorkflowConfig = {
  name: string;
  layoutDirection: LayoutDirection;
  seed: Seed;
  templates?: DiagramTemplateConfig[];
};

/* ---------------------------------------------------------------- profile */

export type StatusVocabularyEntry = {
  value: string;
  label: string;
  icon: string;
  tone: 'ok' | 'warn' | 'danger' | 'muted';
};

/**
 * Which of a human node's properties feed the Tasks screen.
 *
 * The property NAMES are domain vocabulary — Invoice Approval calls it
 * `assignee` / `dueAfterHours`, the editorial profile calls it `editor` /
 * `slaHours`. Hard-coding either set into the run engine would silently blank
 * the other profile's inbox, so the mapping is config like everything else.
 */
export type TaskFieldMap = {
  assignee?: string;
  priority?: string;
  dueHours?: string;
  note?: string;
  allowReject?: string;
};

/** One row in the task detail's fact sheet. */
export type RunFact = {
  label: string;
  /** A key of `run.context`. */
  key: string;
  format?: 'text' | 'money' | 'flag';
  /** `money` only — where to read the ISO currency code from. */
  currencyKey?: string;
  /** `flag` only. */
  trueText?: string;
  falseText?: string;
  strong?: boolean;
};

/**
 * The mocked upstream result a run carries, plus how to present it.
 *
 * This is what branch conditions resolve `{{...}}` against, so the keys must
 * match the operands the profile's own condition nodes reference — Invoice
 * Approval compares `{{ai.amount}}`, the editorial profile
 * `{{draft.readability}}`. Keeping it in config is what lets one engine run both.
 */
export type RunConfig = {
  context: Record<string, unknown>;
  facts: RunFact[];
};

export type ProfileMeta = {
  id: ProfileId;
  label: string;
  description: string;
  icon: string;
  chrome: {
    documentTitle: string;
    productName: string;
    tagline?: string;
    nav: { id: string; label: string; icon: string }[];
  };
  statusVocabulary?: StatusVocabularyEntry[];
  /** Maps this domain's human-task property names onto the Tasks screen. */
  taskFields?: TaskFieldMap;
  /** Mocked run context + how the task detail presents it. */
  run?: RunConfig;
  /**
   * Feeds `jsonForm.translations` verbatim, so it uses the SDK's own type rather
   * than a looser local shape — a typo in the config fails at the type gate
   * instead of silently leaving labels untranslated.
   */
  translations?: PluginTranslationResource;
};

/** The assembled document served by `GET /api/profiles/:id`. */
export type EditorProfile = ProfileMeta & {
  theme: ThemeConfig;
  palette: PaletteConfig;
  workflow: WorkflowConfig;
};

/* --------------------------------------------------------------- compiled */

/** Exactly what React hands to `<WorkflowBuilder.Root>`. Every field is stable. */
export type CompiledProfile = {
  id: ProfileId;
  name: string;
  layoutDirection: LayoutDirection;
  nodeTypes: PaletteItemOrGroup[];
  initialNodes: WorkflowBuilderNode[];
  initialEdges: WorkflowBuilderEdge[];
  diagramTemplates: TemplateModel[];
  translations: ProfileMeta['translations'];
  /** Powers the Studio's "which JSON produced this node?" lookup. */
  nodeIndex: Map<string, NodeConfig>;
  source: EditorProfile;
};

export type CompiledNodeSchema = NodeSchema;
export type CompiledUiSchema = UISchema;
