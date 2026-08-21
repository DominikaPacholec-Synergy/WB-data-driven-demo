import type {
  JsonFormsRendererExtension,
  WorkflowBuilderIntegration,
  WorkflowBuilderJsonFormConfig,
  WorkflowBuilderPlugin,
} from '@workflowbuilder/sdk';

import { nodeAnnotationsPlugin } from '@/plugins/node-annotations/node-annotations';
import { currencyAmountRenderer } from '@/renderers/currency-amount/currency-amount';
import { isoDateRenderer } from '@/renderers/iso-date/iso-date';
import { switchFieldRenderer } from '@/renderers/switch-field/switch-field';

/**
 * Custom JsonForms renderers, registered once for the whole app.
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

export const INTEGRATION: WorkflowBuilderIntegration = {
  strategy: 'props',
  onDataSave: async (data) => {
    // The demo has no persistence layer; the diagram JSON is the deliverable.
    console.info('[save] diagram', data);
    return 'success';
  },
};
