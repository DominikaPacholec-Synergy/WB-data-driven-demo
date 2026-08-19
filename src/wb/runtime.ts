import type {
  JsonFormsRendererExtension,
  WorkflowBuilderIntegration,
  WorkflowBuilderJsonFormConfig,
  WorkflowBuilderPlugin,
} from '@workflowbuilder/sdk';

import { nodeAnnotationsPlugin } from '../plugins/nodeAnnotations';
import { currencyAmountRenderer } from '../renderers/currencyAmount';
import { isoDateRenderer } from '../renderers/isoDate';
import { switchFieldRenderer } from '../renderers/switchField';

/**
 * Custom JsonForms renderers, registered once for the whole app.
 *
 * Two kinds live here. `currencyAmount` and `isoDate` are opt-in: which FIELD uses
 * one is decided in `palette.json` via `options.customRenderer`. `switchField` is
 * not — it matches the uischema type, so it replaces the SDK's control for every
 * boolean (caption beside the toggle rather than stacked above it, see the file).
 */
export const CUSTOM_RENDERERS: JsonFormsRendererExtension[] = [
  currencyAmountRenderer,
  isoDateRenderer,
  switchFieldRenderer,
];

/** Used whenever the profile ships no translations — a stable identity. */
export const JSON_FORM: WorkflowBuilderJsonFormConfig = { renderers: CUSTOM_RENDERERS };

/**
 * Module-scope constants for everything the SDK wants as a stable reference but
 * that does not come from the profile. Building any of these inside a component
 * would hand the SDK a new identity on every render.
 */

export const PLUGINS: WorkflowBuilderPlugin[] = [nodeAnnotationsPlugin];

/**
 * `props` rather than `localStorage`: the localStorage strategy writes to a
 * fixed `'workflowBuilderDiagram'` key that is NOT derived from the `name` prop,
 * so two profiles would overwrite each other's diagram.
 *
 * The SDK does not draw that distinction in its UI — it greets any non-empty
 * seed diagram with "Saved data has been restored", whatever the strategy. See
 * `./i18n` for the correction.
 */
export const INTEGRATION: WorkflowBuilderIntegration = {
  strategy: 'props',
  onDataSave: async (data) => {
    // The demo has no persistence layer; the diagram JSON is the deliverable.
    console.info('[save] diagram', data);
    return 'success';
  },
};
