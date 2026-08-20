import { rankWith, uiTypeIs, type ControlProps, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { Switch } from '../components/Switch';

/**
 * Takes over every `{ "type": "Switch" }` element in every profile.
 *
 * Unlike `currencyAmount`, this one is deliberately NOT opt-in per field. That
 * renderer answers "which field wants a different control?" — a question only the
 * config can answer, so it matches on `options.customRenderer`. This one answers
 * nothing: it is the same control, laid out the way a boolean should be laid out.
 * The SDK's shared field wrapper stacks caption over control, which leaves a
 * toggle floating under a line of text. That reads wrong for every boolean, not
 * for one chosen field, so the tester matches the uischema TYPE and `palette.json`
 * says nothing about it.
 *
 * Rank 20 outranks the SDK's own controls, same as `currencyAmount`.
 */

/**
 * `uischema.label` first, because that is where the SDK's controls read their
 * caption and where `compileProfile()`s caption pass puts the property's label.
 * `schema.label` is the fallback for a uischema written by hand, and JsonForms'
 * computed `label` prop the last resort — it humanises the property path, so
 * `autoExtract` would surface as "Auto Extract".
 */
const captionOf = (uischema: ControlProps['uischema'], schema: ControlProps['schema'], label: string) => {
  if (typeof uischema.label === 'string') return uischema.label;
  const fromSchema = (schema as { label?: string } | undefined)?.label;
  return typeof fromSchema === 'string' ? fromSchema : label;
};

const SwitchControl = ({
  data,
  handleChange,
  path,
  label,
  schema,
  uischema,
  enabled,
  visible,
  required,
  errors,
}: ControlProps) => {
  if (visible === false) return null;

  return (
    <Switch
      checked={data === true}
      onChange={(checked) => handleChange(path, checked)}
      label={captionOf(uischema, schema, label)}
      disabled={enabled === false || (uischema as { disabled?: boolean }).disabled === true}
      required={required === true}
      error={errors || undefined}
    />
  );
};

export const switchFieldRenderer: JsonFormsRendererRegistryEntry = {
  tester: rankWith(20, uiTypeIs('Switch')),
  renderer: withJsonFormsControlProps(SwitchControl),
};
