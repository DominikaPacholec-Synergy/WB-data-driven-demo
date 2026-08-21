import type { PluginTranslationResource } from '@workflowbuilder/sdk';

import type { PaletteConfig } from './palette';
import type { ThemeConfig } from './theme';
import type { WorkflowConfig } from './workflow';

/**
 * The editor is described by data. This folder is the contract for that data.
 *
 * Nothing here is a React value: an "editor profile" is JSON all the way down,
 * so it can be served by a backend and swapped at runtime without touching code.
 * This file holds the document itself — the index that lists profiles, the meta
 * every profile carries, and `EditorProfile`, which assembles the four parts.
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

/* -------------------------------------------------------------------- meta */

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

/** One row in the task detail's summary. */
export type RunSummaryRow = {
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
 * `context` keys are `<nodeType>.<output>` — one per property a palette item
 * declares in its `outputSchema`, e.g. `ai.analyze.amount`. Conditions do not
 * name those keys directly: the properties panel writes operands as
 * `{{nodes.<id>.<output>}}` (the only shape it can type, and therefore the only
 * one that offers `>` and `<`), and the engine maps the id through the node on
 * the canvas. Keeping both sides in config is what lets one engine run every
 * profile.
 */
export type RunConfig = {
  context: Record<string, unknown>;
  summary: RunSummaryRow[];
};

export type ProfileMeta = {
  id: ProfileId;
  label: string;
  description: string;
  icon: string;
  chrome: {
    documentTitle: string;
    /** The bar's only brand line, set as a small wordmark next to the logo. */
    tagline: string;
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

/* ---------------------------------------------------------------- document */

/** The assembled document served by `GET /api/profiles/:id`. */
export type EditorProfile = ProfileMeta & {
  theme: ThemeConfig;
  palette: PaletteConfig;
  workflow: WorkflowConfig;
};
