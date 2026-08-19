import { Icon } from '@workflowbuilder/sdk';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Rendered BESIDE the toggle. Omit for a bare switch. */
  label?: string;
  size?: 'extra-small' | 'small' | 'medium';
  disabled?: boolean;
  /** Draws the design system's asterisk in front of the label. */
  required?: boolean;
  /** A validation message, shown under the row. */
  error?: string;
  /** Only read when there is no visible `label`. */
  'aria-label'?: string;
};

/**
 * The switch, shaped like the one Workflow Builder uses — but with its caption
 * beside the toggle instead of above it.
 *
 * Same deal as `Dropdown.tsx` and `src/app/ThemeSwitch.tsx`: the SDK's Switch is
 * not exported, so the markup is ours, while every value in `.switch*` is an
 * `--ax-public-switch-*` / `--ax-public-thumb-*` / `--ax-public-track-*` token
 * declared on `:root` in the SDK's stylesheet — the same ones its own switch
 * reads. The look still comes from the design system, so a brand override in
 * Config Studio flows through here too.
 *
 * Why the layout differs at all: the SDK's shared field wrapper stacks caption
 * over control, which is right for a text box — the caption sits above the thing
 * it names — but leaves a toggle floating under a line of text with nothing
 * tying the two together. A boolean is one unit, so the row IS a `<label>`:
 * clicking the words toggles it, and no id has to be threaded between the text
 * and the input.
 *
 * The `<input type="checkbox" role="switch">` is a real one, laid transparent
 * over the track, so keyboard and screen-reader behaviour stays native and the
 * `:checked` / `:disabled` / `:focus-visible` states drive the CSS directly.
 */
export function Switch({
  checked,
  onChange,
  label,
  size = 'medium',
  disabled = false,
  required = false,
  error,
  'aria-label': ariaLabel,
}: Props) {
  return (
    <div className={`switch switch--${size}${disabled ? ' is-disabled' : ''}`}>
      <label className="switch__row">
        <span className="switch__control">
          <input
            type="checkbox"
            role="switch"
            checked={checked}
            disabled={disabled}
            aria-label={label ? undefined : ariaLabel}
            onChange={(event) => onChange(event.currentTarget.checked)}
          />
          <span className="switch__track" />
          <span className="switch__thumb" />
        </span>
        {label ? (
          <span className="switch__label ax-public-p11">
            {required ? <Icon name="Asterisk" /> : null}
            {label}
          </span>
        ) : null}
      </label>
      {error ? <p className="switch__error">{error}</p> : null}
    </div>
  );
}
