import { useRef, useState } from "react";

import { Dropdown } from "../components/Dropdown";
import {
  exportThemePatch,
  hasOverrides,
  readToken,
  resetAllOverrides,
  setTokenOverride,
} from "../config/theme";
import type { ThemeConfig, TokenControl } from "../config/types";
import { useThemeMode } from "../config/useThemeMode";

/**
 * Live design-token controls, generated from `theme.json`'s `inspector` block.
 */

type Props = { theme: ThemeConfig };

/** `<input type="color">` accepts only `#rrggbb`, so normalise whatever CSS gave us. */
const toHexColor = (value: string): string => {
  const raw = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${[...raw.slice(1)].map((c) => c + c).join("")}`.toLowerCase();
  }
  const channels = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (channels) {
    const [r, g, b] = channels[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number);
    if ([r, g, b].every(Number.isFinite)) {
      const hex = (n: number) =>
        Math.max(0, Math.min(255, Math.round(n)))
          .toString(16)
          .padStart(2, "0");
      return `#${hex(r)}${hex(g)}${hex(b)}`;
    }
  }
  return "#000000";
};

/**
 * The font token in `base` reads `"Poppins", system-ui, -apple-system, sans-serif`
 * while the inspector option offers a shorter stack — same font, different string.
 * Matching on the first family keeps the dropdown in sync without forcing the
 * config author to keep two strings byte-identical.
 */
const matchOption = (
  current: string,
  options: { value: string }[],
): string | undefined => {
  const exact = options.find((option) => option.value === current);
  if (exact) return exact.value;
  const head = (value: string) =>
    value.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
  return options.find((option) => head(option.value) === head(current))?.value;
};

const ColorControl = ({
  control,
  onEdit,
}: {
  control: TokenControl;
  onEdit: () => void;
}) => {
  return (
    <input
      type="color"
      defaultValue={toHexColor(readToken(control.token))}
      onInput={(event) => {
        setTokenOverride(
          control.token,
          event.currentTarget.value,
          control.bucket,
        );
        onEdit();
      }}
    />
  );
};

const LengthControl = ({
  control,
  onEdit,
}: {
  control: TokenControl;
  onEdit: () => void;
}) => {
  // Hook before the guard: hook order must not depend on a prop.
  const readout = useRef<HTMLSpanElement>(null);
  if (control.kind !== "length") return null;
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
};

/** Shown while the live token matches none of the exposed options. */
const FROM_THEME = { value: "", label: "From theme.json" };

/*
 * The one control on this panel that holds state, and the stability rule
 * survives it: a dropdown commits once per choice, not once per animation frame
 * like the sliders, and the state is local — nothing above this component
 * re-renders, least of all `<Root>`. Controlled is not optional here, because
 * the value IS what the trigger displays; re-reading the token would only tell
 * us what it was before the click.
 *
 * Reset still works through the `generation` key on the list: remounting re-runs
 * `readToken`, and the initialiser picks the restored value up.
 */
const ChoiceDropdown = ({
  control,
  onEdit,
}: {
  control: Extract<TokenControl, { kind: "choice" }>;
  onEdit: () => void;
}) => {
  const live = matchOption(readToken(control.token), control.options);
  const [value, setValue] = useState(live ?? FROM_THEME.value);

  return (
    <Dropdown
      size="small"
      value={value}
      options={
        live === undefined ? [FROM_THEME, ...control.options] : control.options
      }
      onChange={(next) => {
        setValue(next);
        setTokenOverride(control.token, next, control.bucket);
        onEdit();
      }}
      aria-label={control.label}
    />
  );
};

/*
 * Two components rather than one so the guard can stay above the hook: the
 * sibling controls narrow `TokenControl` with an early return, and this is the
 * only one that needs state, which must not sit behind a conditional return.
 */
const ChoiceControl = ({
  control,
  onEdit,
}: {
  control: TokenControl;
  onEdit: () => void;
}) => {
  if (control.kind !== "choice") return null;
  return <ChoiceDropdown control={control} onEdit={onEdit} />;
};

export const TokenPanel = ({ theme }: Props) => {
  const mode = useThemeMode();
  const [dirty, setDirty] = useState(hasOverrides());
  const [copied, setCopied] = useState(false);
  /** Bumped on Reset to remount the uncontrolled inputs so they re-read the DOM. */
  const [generation, setGeneration] = useState(0);

  // React bails out when the value is unchanged, so this fires one render on the
  // first edit of a drag and none thereafter.
  const onEdit = () => setDirty(true);

  const copy = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(exportThemePatch(), null, 2),
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="studio__panel">
      <p className="studio__lede">
        Every control below is one entry in <code>theme.json</code>. The names
        are the design system's own custom properties — no aliases, no
        translation layer.
      </p>

      {/*
        Keyed by mode + generation so the widgets re-read their value when the
        theme flips or Reset drops the overrides. Remounting is correct here:
        the inputs are uncontrolled, so this is the only way their displayed
        value can follow a change that did not come from the widget itself.
      */}
      <div className="studio__groups" key={`${mode}:${generation}`}>
        {theme.inspector.map((group) => (
          <section className="studio__group" key={group.label}>
            <h3>{group.label}</h3>
            {group.controls.map((control) => (
              <label className="studio__control" key={control.token}>
                <span className="studio__label">
                  {control.label}
                  {control.bucket === "mode" ? <em> · {mode}</em> : null}
                </span>
                <code className="studio__token">{control.token}</code>
                {control.kind === "color" ? (
                  <ColorControl control={control} onEdit={onEdit} />
                ) : control.kind === "length" ? (
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
          {copied ? "Copied" : "Copy theme.json"}
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
        “Copy theme.json” gives you the exact file a backend would serve. What
        you dragged is data.
      </p>
    </div>
  );
};
