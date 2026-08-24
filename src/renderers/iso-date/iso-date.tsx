import { type ControlProps, type JsonFormsRendererRegistryEntry, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import clsx from 'clsx';

import styles from '../renderers.module.css';

const OPTION_NAME = 'IsoDate';

type Options = { customRenderer?: string };

const optionsOf = (uischema: unknown): Options =>
  ((uischema as { options?: Options })?.options ?? {}) as Options;

const toIsoDay = (raw: unknown): string => {
  if (typeof raw !== 'string' || raw === '') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';

  /*
   * Local getters, NOT `toISOString()`. The stored string carries an offset, and
   * shifting it to UTC moves the day for anyone east of Greenwich: a date picked as
   * midnight in GMT+0200 becomes 22:00 the PREVIOUS day.
   */
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const IsoDateControl = ({
  data,
  handleChange,
  path,
  label,
  enabled,
  visible,
  errors,
  schema,
}: ControlProps) => {
  const caption = (schema as { label?: string } | undefined)?.label ?? label;

  if (visible === false) return null;

  return (
    <div className={styles['control']}>
      <label className={styles['label']} htmlFor={path}>
        {caption}
      </label>
      <div
        className={clsx(styles['field'], styles['field--date'], {
          [styles['is-invalid']]: errors,
        })}
      >
        <input
          id={path}
          type="date"
          disabled={enabled === false}
          value={toIsoDay(data)}
          onChange={(event) => handleChange(path, event.target.value || undefined)}
        />
      </div>
      {errors ? <p className={styles['error']}>{errors}</p> : null}
    </div>
  );
};

export const isoDateRenderer: JsonFormsRendererRegistryEntry = {
  tester: rankWith(20, (uischema) => optionsOf(uischema).customRenderer === OPTION_NAME),
  renderer: withJsonFormsControlProps(IsoDateControl),
};
