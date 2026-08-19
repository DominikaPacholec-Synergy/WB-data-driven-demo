import { Icon } from '@workflowbuilder/sdk';

import type { ThemeMode } from '../config/types';

type Props = {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
};

/**
 * The light/dark control, shaped like the icon switch the SDK carries in
 * `WorkflowBuilder.TopBar` — the bar we replaced with our own header, which is
 * why we have to bring the switch along.
 *
 * The component is not part of the SDK's public API, but its geometry and
 * colours are: every value in `.themeswitch` is an `--ax-public-icon-switch-*`
 * token declared on `:root` in the SDK's `style.css`. So only the markup is
 * ours — the look still comes from the design system, and it keeps following
 * both themes and any token override made in Config Studio.
 *
 * The two track icons are the ends of the range; the thumb repeats the active
 * one, which is what makes the state readable without a label. What names it in
 * words is the `<Tooltip>` the app bar wraps it in, plus the input's own
 * `aria-label` — the switch itself carries no text at any width.
 */
export function ThemeSwitch({ mode, onChange }: Props) {
  const dark = mode === 'dark';

  return (
    <label className="themeswitch">
      <input
        type="checkbox"
        role="switch"
        aria-label="Dark mode"
        checked={dark}
        onChange={(event) => onChange(event.target.checked ? 'dark' : 'light')}
      />
      <span className="themeswitch__track" aria-hidden="true">
        <span className="themeswitch__icon">
          <Icon name="Sun" size="medium" />
        </span>
        <span className="themeswitch__icon">
          <Icon name="Moon" size="medium" />
        </span>
      </span>
      <span className="themeswitch__thumb" aria-hidden="true">
        <Icon name={dark ? 'Moon' : 'Sun'} size="medium" />
      </span>
    </label>
  );
}
