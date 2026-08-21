import {
  type ControlProps,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { Switch } from '@/components/switch/switch';

const captionOf = (
  uischema: ControlProps['uischema'],
  schema: ControlProps['schema'],
  label: string,
) => {
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
