import { Icon, type WBIcon, useWorkflowBuilderActions } from '@workflowbuilder/sdk';
import clsx from 'clsx';
import { useMemo } from 'react';

import { Dropdown } from '@/components/dropdown/dropdown';
import { Tooltip } from '@/components/tooltip/tooltip';
import { setMode } from '@/config/theme';
import type { ProfileId, ProfileIndexEntry, ProfileMeta } from '@/config/types/profile';
import type { ThemeMode } from '@/config/types/theme';
import { useThemeMode } from '@/config/use-theme-mode';
import { useProvenanceStore } from '@/plugins/provenance';

import styles from './app-bar.module.css';

import { ThemeSwitch } from '../theme-switch/theme-switch';

type Props = {
  profiles: ProfileIndexEntry[];
  profileId: ProfileId | null;
  chrome: ProfileMeta['chrome'];
  route: string;
  studioOpen: boolean;
  pendingTasks: number;
  onNavigate: (route: string) => void;
  onSwitchProfile: (id: ProfileId) => void;
  onToggleStudio: () => void;
  onRun: () => void;
};

export const AppBar = ({
  profiles,
  profileId,
  chrome,
  route,
  studioOpen,
  pendingTasks,
  onNavigate,
  onSwitchProfile,
  onToggleStudio,
  onRun,
}: Props) => {
  const actions = useWorkflowBuilderActions();
  const provenance = useProvenanceStore((state) => state.enabled);
  const toggleProvenance = useProvenanceStore((state) => state.toggle);
  const mode = useThemeMode();

  const profileOptions = useMemo(
    () => profiles.map((entry) => ({ value: entry.id, label: entry.label })),
    [profiles],
  );

  const changeTheme = (next: ThemeMode) => {
    setMode(next);
    actions.setTheme(next);
  };

  return (
    <header className={styles['appbar']}>
      <div className={styles['left']}>
        <div className={styles['brand']}>
          <Icon name="WorkflowBuilderLogo" size="medium" />
          <span className={styles['tagline']}>{chrome.tagline}</span>
        </div>

        <nav className={styles['nav']}>
          {chrome.nav.map((item) => (
            <Tooltip key={item.id} label={item.label} align="start">
              <button
                type="button"
                aria-current={route === item.id}
                className={clsx({ [styles['is-active']]: route === item.id })}
                onClick={() => onNavigate(item.id)}
              >
                <Icon name={item.icon as WBIcon} size="large" />
                <span className={styles['label']}>{item.label}</span>
                {item.id === 'tasks' && pendingTasks > 0 ? (
                  <span className={styles['count']}>{pendingTasks}</span>
                ) : null}
              </button>
            </Tooltip>
          ))}
        </nav>
      </div>

      <div className={clsx(styles['field'], styles['profile'])}>
        <span>Profile</span>
        <Tooltip label="Everything below is described by the JSON this profile serves">
          <Dropdown
            value={profileId}
            options={profileOptions}
            onChange={onSwitchProfile}
            aria-label="Profile"
          />
        </Tooltip>
      </div>

      <div className={styles['actions']}>
        <Tooltip label="Toggle light / dark" align="end">
          <ThemeSwitch mode={mode} onChange={changeTheme} />
        </Tooltip>
        <Tooltip
          label="Fingerprint"
          description="Label every node with the config entry it was compiled from"
          align="end"
        >
          <button
            type="button"
            aria-pressed={provenance}
            className={clsx({ [styles['toggled']]: provenance })}
            onClick={toggleProvenance}
          >
            <Icon name="Fingerprint" size="large" />
            <span className={styles['label']}>Fingerprint</span>
          </button>
        </Tooltip>
        <Tooltip
          label="Config Studio"
          description="Edit the JSON this editor was compiled from"
          align="end"
        >
          <button
            type="button"
            aria-pressed={studioOpen}
            className={clsx({ [styles['toggled']]: studioOpen })}
            onClick={onToggleStudio}
          >
            <Icon name="Faders" size="large" />
            <span className={styles['label']}>Config Studio</span>
          </button>
        </Tooltip>
        <Tooltip label="Run the workflow" align="end">
          <button type="button" className={styles['primary']} onClick={onRun}>
            <Icon name="Play" size="large" />
            <span className={styles['label']}>Run</span>
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
