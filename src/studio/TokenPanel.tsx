import { useRef, useState } from 'react';

import {
  exportThemePatch,
  hasOverrides,
  readToken,
  resetAllOverrides,
  setTokenOverride,
} from '../config/theme';
import type { ThemeConfig, TokenControl } from '../config/types';
import { useThemeMode } from './useThemeMode';

/**
 * Live design-token controls, generated from `theme.json`'s `inspector` block.
 *
 * Nothing here knows what a "brand colour" is. The panel walks a list of token
 * names the config chose to expose and renders a widget per `kind` — so adding
 * a knob is a JSON edit, exactly like everything else in this demo.
 *
 * THE STABILITY RULE (see useProfileRuntime): a token edit must NOT become React
 * state. Re-rendering this component's ancestors would hand the SDK a fresh
 * `nodeTypes` array identity on every slider frame, overwriting its module-level
 * palette holder. So the inputs are uncontrolled, the value readout is written
 * straight to the DOM through a ref, and `setTokenOverride` writes to
 * `document.documentElement`. Zero renders per frame, by construction.
 */

type Props = { theme: ThemeConfig };

/** `<input type="color">` accepts only `#rrggbb`, so normalise whatever CSS gave us. */
function toHexColor(value: string): string {
  const raw = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${[...raw.slice(1)].map((c) => c + c).join('')}`.toLowerCase();
  }
  const channels = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (channels) {
    const [r, g, b] = channels[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if ([r, g, b].every(Number.isFinite)) {
      const hex = (n: number) =>
        Math.max(0, Math.min(255, Math.round(n)))
          .toString(16)
          .padStart(2, '0');
      return `#${hex(r)}${hex(g)}${hex(b)}`;
    }
  }
  return '#000000';
}

/**
 * The font token in `base` reads `"Poppins", system-ui, -apple-system, sans-serif`
 * while the inspector option offers a shorter stack — same font, different string.
 * Matching on the first family keeps the dropdown in sync without forcing the
 * config author to keep two strings byte-identical.
 */
function matchOption(current: string, options: { value: string }[]): string | undefined {
  const exact = options.find((option) => option.value === current);
  if (exact) return exact.value;
  const head = (value: string) => value.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
  return options.find((option) => head(option.value) === head(current))?.value;
}

function ColorControl({ control, onEdit }: { control: TokenControl; onEdit: () => void }) {
  return (
    <input
      type="color"
      defaultValue={toHexColor(readToken(control.token))}
      onInput={(event) => {
        setTokenOverride(control.token, event.currentTarget.value, control.bucket);
        onEdit();
      }}
    />
  );
}

function LengthControl({ control, onEdit }: { control: TokenControl; onEdit: () => void }) {
  // Hook before the guard: hook order must not depend on a prop.
  const readout = useRef<HTMLSpanElement>(null);
  if (control.kind !== 'length') return null;
  const initial = Number.parseFloat(readToken(control.token)) || control.min;

  return (
    <div className="studio__slider">
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        defaultValue={initial}
        onInput={(event) => {
          const next = `${event.currentTarget.value}${control.unit}`;
          setTokenOverride(control.token, next, control.bucket);
          // Written directly, never through state — see the stability rule above.
          if (readout.current) readout.current.textContent = next;
          onEdit();
        }}
      />
      <span className="studio__value" ref={readout}>
        {initial}
        {control.unit}
      </span>
    </div>
  );
}

function ChoiceControl({ control, onEdit }: { control: TokenControl; onEdit: () => void }) {
  if (control.kind !== 'choice') return null;
  const current = matchOption(readToken(control.token), control.options);

  return (
    <select
      defaultValue={current ?? ''}
      onChange={(event) => {
        setTokenOverride(control.token, event.currentTarget.value, control.bucket);
        onEdit();
      }}
    >
      {current === undefined ? <option value="">From theme.json</option> : null}
      {control.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function TokenPanel({ theme }: Props) {
  const mode = useThemeMode();
  const [dirty, setDirty] = useState(hasOverrides());
  const [copied, setCopied] = useState(false);
  /** Bumped on Reset to remount the uncontrolled inputs so they re-read the DOM. */
  const [generation, setGeneration] = useState(0);

  // React bails out when the value is unchanged, so this fires one render on the
  // first edit of a drag and none thereafter.
  const onEdit = () => setDirty(true);

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(exportThemePatch(), null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="studio__panel">
      <p className="studio__lede">
        Every control below is one entry in <code>theme.json</code>. The names are the design
        system's own custom properties — no aliases, no translation layer.
      </p>

      {/*
        Keyed by mode + generation so the widgets re-read their value when the
        theme flips or Reset drops the overrides. Remounting is correct here:
        the inputs are uncontrolled, so this is the only way their displayed
        value can follow a change that did not come from the widget itself.
      */}
      <div key={`${mode}:${generation}`}>
        {theme.inspector.map((group) => (
          <section className="studio__group" key={group.label}>
            <h3>{group.label}</h3>
            {group.controls.map((control) => (
              <label className="studio__control" key={control.token}>
                <span className="studio__label">
                  {control.label}
                  {control.bucket === 'mode' ? <em> · {mode}</em> : null}
                </span>
                <code className="studio__token">{control.token}</code>
                {control.kind === 'color' ? (
                  <ColorControl control={control} onEdit={onEdit} />
                ) : control.kind === 'length' ? (
                  <LengthControl control={control} onEdit={onEdit} />
                ) : (
                  <ChoiceControl control={control} onEdit={onEdit} />
                )}
              </label>
            ))}
          </section>
        ))}
      </div>

      <footer className="studio__footer">
        <button type="button" onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy theme.json'}
        </button>
        <button
          type="button"
          disabled={!dirty}
          onClick={() => {
            resetAllOverrides();
            setDirty(false);
            setGeneration((n) => n + 1);
          }}
        >
          Reset
        </button>
      </footer>
      <p className="studio__hint">
        “Copy theme.json” gives you the exact file a backend would serve. What you dragged is data.
      </p>
    </div>
  );
}
