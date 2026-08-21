import { Icon } from '@workflowbuilder/sdk';

import type { ThemeMode } from '@/config/types/theme';

import styles from './theme-switch.module.css';

type Props = {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
};

export const ThemeSwitch = ({ mode, onChange }: Props) => {
  const dark = mode === 'dark';

  return (
    <label className={styles['theme-switch']}>
      <input
        type="checkbox"
        role="switch"
        aria-label="Dark mode"
        checked={dark}
        onChange={(event) => onChange(event.target.checked ? 'dark' : 'light')}
      />
      <span className={styles['track']} aria-hidden="true">
        <span className={styles['icon']}>
          <Icon name="Sun" size="medium" />
        </span>
        <span className={styles['icon']}>
          <Icon name="Moon" size="medium" />
        </span>
      </span>
      <span className={styles['thumb']} aria-hidden="true">
        <Icon name={dark ? 'Moon' : 'Sun'} size="medium" />
      </span>
    </label>
  );
};
