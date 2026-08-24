import clsx from 'clsx';
import { useRef, useState } from 'react';

import { Dropdown } from '@/components/dropdown/dropdown';
import {
  exportThemePatch,
  hasOverrides,
  readToken,
  resetAllOverrides,
  setTokenOverride,
} from '@/config/theme';
import type { ThemeConfig, TokenControl } from '@/config/types/theme';
import { useThemeMode } from '@/config/use-theme-mode';

import styles from './studio.module.css';

import { matchOption } from './helpers/match-option';
import { toHexColor } from './helpers/to-hex-color';

/**
 * Live design-token controls, generated from `theme.json`'s `inspector` block.
 */

type Props = { theme: ThemeConfig };

const ColorControl = ({ control, onEdit }: { control: TokenControl; onEdit: () => void }) => {
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
};

const LengthControl = ({ control, onEdit }: { control: TokenControl; onEdit: () => void }) => {
  const readout = useRef<HTMLSpanElement>(null);
  if (control.kind !== 'length') return null;
  const initial = Number.parseFloat(readToken(control.token)) || control.min;

  return (
    <div className={styles['slider']}>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        defaultValue={initial}
        onInput={(event) => {
          const next = `${event.currentTarget.value}${control.unit}`;
          setTokenOverride(control.token, next, control.bucket);

          if (readout.current) readout.current.textContent = next;
          onEdit();
        }}
      />
      <span className={styles['value']} ref={readout}>
        {initial}
        {control.unit}
      </span>
    </div>
  );
};

/** Shown while the live token matches none of the exposed options. */
const FROM_THEME = { value: '', label: 'From theme.json' };

const ChoiceDropdown = ({
  control,
  onEdit,
}: {
  control: Extract<TokenControl, { kind: 'choice' }>;
  onEdit: () => void;
}) => {
  const live = matchOption(readToken(control.token), control.options);
  const [value, setValue] = useState(live ?? FROM_THEME.value);

  return (
    <Dropdown
      size="small"
      value={value}
      options={live === undefined ? [FROM_THEME, ...control.options] : control.options}
      onChange={(next) => {
        setValue(next);
        setTokenOverride(control.token, next, control.bucket);
        onEdit();
      }}
      aria-label={control.label}
    />
  );
};

const ChoiceControl = ({ control, onEdit }: { control: TokenControl; onEdit: () => void }) => {
  if (control.kind !== 'choice') return null;
  return <ChoiceDropdown control={control} onEdit={onEdit} />;
};

export const TokenPanel = ({ theme }: Props) => {
  const mode = useThemeMode();
  const [dirty, setDirty] = useState(hasOverrides());
  const [copied, setCopied] = useState(false);

  const [generation, setGeneration] = useState(0);

  const onEdit = () => setDirty(true);

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(exportThemePatch(), null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={styles['panel']}>
      <div className={styles['scroll']}>
        <p className={styles['lede']}>
          Every control below is one entry in <code>theme.json</code>. The names are the design
          system's own custom properties — no aliases, no translation layer.
        </p>

        <div className={styles['groups']} key={`${mode}:${generation}`}>
          {theme.inspector.map((group) => (
            <section className={styles['group']} key={group.label}>
              <h3>{group.label}</h3>
              {group.controls.map((control) => (
                <label className={styles['control']} key={control.token}>
                  <span className={styles['label']}>
                    {control.label}
                    {control.bucket === 'mode' ? <em> · {mode}</em> : null}
                  </span>
                  <code className={styles['token']}>{control.token}</code>
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
      </div>

      <footer className={clsx(styles['footer'], styles['footer--divided'])}>
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
      <p className={styles['hint']}>
        “Copy theme.json” gives you the exact file a backend would serve. What you dragged is data.
      </p>
    </div>
  );
};
