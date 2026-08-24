import { type ControlProps, type JsonFormsRendererRegistryEntry, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import clsx from 'clsx';

import { formatMoney } from '@/helpers/format-money';

import styles from '../renderers.module.css';

/**
 * A custom property-panel control
 */

const OPTION_NAME = 'CurrencyAmount';

type Options = { customRenderer?: string; currency?: string };

const optionsOf = (uischema: unknown): Options =>
  ((uischema as { options?: Options })?.options ?? {}) as Options;

const CurrencyAmountControl = ({
  data,
  handleChange,
  path,
  label,
  enabled,
  visible,
  errors,
  schema,
  uischema,
}: ControlProps) => {
  const currency = optionsOf(uischema).currency ?? 'EUR';

  const caption = (schema as { label?: string } | undefined)?.label ?? label;

  if (visible === false) return null;

  const committed = typeof data === 'number' && Number.isFinite(data) ? data : undefined;
  const formatted = committed === undefined ? '' : formatMoney(committed, currency);

  const commit = (raw: string, element: HTMLInputElement) => {
    const cleaned = raw.replace(/[^\d.,-]/g, '').replace(',', '.');
    const parsed = Number.parseFloat(cleaned);
    const next = Number.isFinite(parsed) ? parsed : undefined;
    element.value = next === undefined ? '' : formatMoney(next, currency);
    if (next !== committed) handleChange(path, next);
  };

  return (
    <div className={styles['control']}>
      <label className={styles['label']} htmlFor={path}>
        {caption}
      </label>
      <div className={clsx(styles['field'], { [styles['is-invalid']]: errors })}>
        <span className={styles['badge']}>{currency}</span>
        <input
          id={path}
          key={formatted}
          type="text"
          inputMode="decimal"
          disabled={enabled === false}
          defaultValue={formatted}
          onFocus={(event) => {
            event.currentTarget.value = committed === undefined ? '' : String(committed);
          }}
          onBlur={(event) => commit(event.currentTarget.value, event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
      </div>
      {errors ? <p className={styles['error']}>{errors}</p> : null}
    </div>
  );
};

export const currencyAmountRenderer: JsonFormsRendererRegistryEntry = {
  tester: rankWith(20, (uischema) => optionsOf(uischema).customRenderer === OPTION_NAME),
  renderer: withJsonFormsControlProps(CurrencyAmountControl),
};
