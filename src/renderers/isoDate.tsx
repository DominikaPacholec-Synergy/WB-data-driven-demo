import { rankWith, type ControlProps, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

/**
 * A date control that actually honours `format: "date"`.
 *
 * The SDK's own `DatePicker` renderer stores `Date.prototype.toString()` —
 * `"Wed Aug 19 2026 00:00:00 GMT+0200 (Central European Summer Time)"`. Ajv checks
 * `format: "date"` against `/^\d{4}-\d{2}-\d{2}$/`, so every pick failed validation
 * and the panel drew its orange error dot (`_with-indicator-dot`, orange-400,
 * pulsing) next to the field. The schema was right; the value was wrong.
 *
 * A native `<input type="date">` speaks `YYYY-MM-DD` in both `value` and
 * `event.target.value`, so the round trip needs no date maths and has no timezone
 * failure mode. The SDK's styled Mantine input is not part of its public API —
 * `index.d.ts` exports the `DatePicker` uischema element type, not a component — so
 * supplying our own is the available route, the same conclusion `currencyAmount`
 * reached for its field.
 *
 * Like every custom control here, WHICH field gets it stays a decision in data:
 *
 *   { "type": "DatePicker",
 *     "scope": "#/properties/valueDate",
 *     "options": { "customRenderer": "IsoDate" } }
 */

const OPTION_NAME = 'IsoDate';

type Options = { customRenderer?: string };

const optionsOf = (uischema: unknown): Options =>
  ((uischema as { options?: Options })?.options ?? {}) as Options;

/**
 * Accepts what the SDK's DatePicker may already have written, so switching a field
 * over does not blank a value someone picked before this renderer existed.
 */
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
  /*
   * The SDK's field schemas carry `label`, whereas JsonForms derives its own `label`
   * prop from `title` / the property path. Reading `schema.label` first keeps this
   * control consistent with every built-in one — otherwise this field alone would
   * show a humanised "Value Date" instead of the configured "Value date".
   */
  const caption = (schema as { label?: string } | undefined)?.label ?? label;

  if (visible === false) return null;

  return (
    <div className="isodate">
      <label className="isodate__label" htmlFor={path}>
        {caption}
      </label>
      <div className={`isodate__field${errors ? ' is-invalid' : ''}`}>
        <input
          id={path}
          type="date"
          disabled={enabled === false}
          value={toIsoDay(data)}
          /*
           * An empty string means the widget holds an incomplete date. Writing
           * `undefined` drops the key rather than storing `""`, which would fail
           * `format: "date"` and put the dot back — and matches how the currency
           * control clears a number.
           */
          onChange={(event) => handleChange(path, event.target.value || undefined)}
        />
      </div>
      {errors ? <p className="isodate__error">{errors}</p> : null}
    </div>
  );
};

/**
 * Rank 20 so it outranks the SDK's own DatePicker for this one field. Same rank as
 * the currency control; the two testers are disjoint, so there is no contest.
 */
export const isoDateRenderer: JsonFormsRendererRegistryEntry = {
  tester: rankWith(20, (uischema) => optionsOf(uischema).customRenderer === OPTION_NAME),
  renderer: withJsonFormsControlProps(IsoDateControl),
};
