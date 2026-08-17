import { rankWith, type ControlProps, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { formatMoney } from '../views/format';

/**
 * A custom property-panel control, chosen BY NAME FROM THE CONFIG.
 *
 * This is the honest edge of the thesis. The SDK ships eleven controls; when a
 * field needs something they do not cover, you write a component — that part is
 * code. But *which* field gets it stays a decision in data:
 *
 *   { "type": "Text",
 *     "scope": "#/properties/thresholdAmount",
 *     "options": { "customRenderer": "CurrencyAmount", "currency": "EUR" } }
 *
 * The tester matches on that one key, so moving the control to another field, or
 * withdrawing it, is a JSON edit. Nothing is registered per-field in code.
 *
 * (`registerCustomRenderers` appears in the SDK's JSDoc but is not exported —
 * the `jsonForm` prop is the supported route.)
 */

const OPTION_NAME = 'CurrencyAmount';

type Options = { customRenderer?: string; currency?: string };

const optionsOf = (uischema: unknown): Options =>
  ((uischema as { options?: Options })?.options ?? {}) as Options;

function CurrencyAmountControl({
  data,
  handleChange,
  path,
  label,
  enabled,
  visible,
  errors,
  schema,
  uischema,
}: ControlProps) {
  const currency = optionsOf(uischema).currency ?? 'EUR';

  /*
   * The SDK's field schemas carry `label`, whereas JsonForms derives its own
   * `label` prop from `title` / the property path. Reading `schema.label` first
   * keeps a custom control consistent with every built-in one — otherwise this
   * field alone would show a humanised "Threshold Amount" instead of the
   * configured "Auto-approve below".
   */
  const caption = (schema as { label?: string } | undefined)?.label ?? label;

  if (visible === false) return null;

  const committed = typeof data === 'number' && Number.isFinite(data) ? data : undefined;
  const formatted = committed === undefined ? '' : formatMoney(committed, currency);

  /*
   * Uncontrolled: the in-progress text lives in the DOM, not in React state.
   *
   * Two reasons. The display value is derived (`1000` while editing, `1000 €` at
   * rest), so a controlled input would have to hold a parallel draft and keep it
   * in sync with `data` arriving from JsonForms. And this matches the discipline
   * the Config Studio already uses — edits go straight to the DOM, React holds
   * nothing it would have to reconcile. `key={formatted}` re-seeds the field
   * whenever the value changes from elsewhere (a Config Studio Apply, or another
   * node being selected).
   */
  const commit = (raw: string, element: HTMLInputElement) => {
    const cleaned = raw.replace(/[^\d.,-]/g, '').replace(',', '.');
    const parsed = Number.parseFloat(cleaned);
    const next = Number.isFinite(parsed) ? parsed : undefined;
    element.value = next === undefined ? '' : formatMoney(next, currency);
    if (next !== committed) handleChange(path, next);
  };

  return (
    <div className="currency">
      <label className="currency__label" htmlFor={path}>
        {caption}
      </label>
      <div className={`currency__field${errors ? ' is-invalid' : ''}`}>
        <span className="currency__badge">{currency}</span>
        <input
          id={path}
          key={formatted}
          type="text"
          inputMode="decimal"
          disabled={enabled === false}
          defaultValue={formatted}
          // Swap to plain digits while typing; the currency suffix fights the caret.
          onFocus={(event) => {
            event.currentTarget.value = committed === undefined ? '' : String(committed);
          }}
          onBlur={(event) => commit(event.currentTarget.value, event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
      </div>
      {errors ? <p className="currency__error">{errors}</p> : null}
    </div>
  );
}

/**
 * Rank 20 so it outranks the SDK's own controls for this one field. The tester
 * reads only `uischema.options.customRenderer` — no field names in code.
 */
export const currencyAmountRenderer: JsonFormsRendererRegistryEntry = {
  tester: rankWith(20, (uischema) => optionsOf(uischema).customRenderer === OPTION_NAME),
  renderer: withJsonFormsControlProps(CurrencyAmountControl),
};
