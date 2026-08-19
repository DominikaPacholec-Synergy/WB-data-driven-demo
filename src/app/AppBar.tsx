import { useMemo } from 'react';
import { Icon, useWorkflowBuilderActions, type WBIcon } from '@workflowbuilder/sdk';

import { Dropdown } from '../components/Dropdown';
import { Tooltip } from '../components/Tooltip';
import { setMode } from '../config/theme';
import { useThemeMode } from '../config/useThemeMode';
import { useProvenanceStore } from '../plugins/provenance';
import { ThemeSwitch } from './ThemeSwitch';
import type { ProfileId, ProfileIndexEntry, ProfileMeta, ThemeMode } from '../config/types';

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

/**
 * Our own header instead of `WorkflowBuilder.TopBar`, driven by
 * `useWorkflowBuilderActions()` — which must be called from a descendant of
 * `<Root>`, so this component only ever renders inside it.
 *
 * The nav items are not hard-coded: they come from `profile.chrome.nav`, so even
 * the shell's navigation is part of the config being demonstrated.
 *
 * Every label sits in its own `.appbar__label` span. That is not decoration:
 * a container query in `app.css` hides those spans as the bar narrows, which
 * is how the buttons collapse to icons instead of colliding with the profile
 * picker when the Config Studio dock takes a third of the shell.
 *
 * What still says what a button does once the text is gone is `<Tooltip>` — one
 * around every control here, at every width, in place of the `title` attributes
 * these buttons used to carry. Each cluster's bubbles hang from its own outer
 * edge, `start` on the left and `end` on the right, because the bar pushes the
 * clusters apart: a bubble centred on an outermost control reaches outside the
 * shell, and `.shell`'s `overflow: hidden` cuts that off rather than scrolling to
 * it. Only the centred picker gets a centred bubble.
 *
 * The bubbles are `aria-hidden`. They have to be: the collapsed label is hidden
 * visually rather than removed (see the container query), so the accessible name
 * still comes from the markup and a tooltip repeating it would only double it up.
 * `ConfigStudio`'s close button keeps its native `title` — it is not part of the
 * bar.
 */
export function AppBar({
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
}: Props) {
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
    // Keep the SDK's internal subscribers in step with the attribute we just set.
    actions.setTheme(next);
  };

  return (
    <header className="appbar">
      <div className="appbar__left">
        <div className="appbar__brand">
          <Icon name="WorkflowBuilderLogo" size="medium" />
          <span className="appbar__tagline">{chrome.tagline}</span>
        </div>

        <nav className="appbar__nav">
          {chrome.nav.map((item) => (
            // The config gives a nav item one string, so that string is the whole
            // tooltip — there is no second sentence to put under it.
            <Tooltip key={item.id} label={item.label} align="start">
              <button
                type="button"
                aria-current={route === item.id}
                className={route === item.id ? 'is-active' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                {/* Config keeps icons as plain strings so the JSON stays pure; the
                    cast is the one boundary where that string becomes a WBIcon. */}
                <Icon name={item.icon as WBIcon} size="large" />
                <span className="appbar__label">{item.label}</span>
                {/* Outside the label span on purpose: a count that disappears with
                    the text would take the one thing the collapsed nav still has
                    to say. */}
                {item.id === 'tasks' && pendingTasks > 0 ? (
                  <span className="appbar__count">{pendingTasks}</span>
                ) : null}
              </button>
            </Tooltip>
          ))}
        </nav>
      </div>

      {/*
       * The centre of the bar: the one control the whole demo turns on. It is
       * taken out of flow in CSS and pinned to the middle, the way Workflow
       * Builder centres its diagram title — so the two clusters either side can
       * be any width without ever pushing it off the axis.
       */}
      <div className="appbar__field appbar__profile">
        <span>Profile</span>
        {/* The picker keeps its own "Profile" caption at every width, so the
            bubble carries the point rather than repeating the word. */}
        <Tooltip label="Everything below is described by the JSON this profile serves">
          <Dropdown
            value={profileId}
            options={profileOptions}
            onChange={onSwitchProfile}
            aria-label="Profile"
          />
        </Tooltip>
      </div>

      <div className="appbar__actions">
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
            className={provenance ? 'appbar__toggled' : undefined}
            onClick={toggleProvenance}
          >
            <Icon name="Fingerprint" size="large" />
            <span className="appbar__label">Fingerprint</span>
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
            className={studioOpen ? 'appbar__toggled' : undefined}
            onClick={onToggleStudio}
          >
            <Icon name="Faders" size="large" />
            <span className="appbar__label">Config Studio</span>
          </button>
        </Tooltip>
        {/* The primary action keeps its label at every width, so its bubble is the
            hint rather than the name — "Run" over a button reading Run is noise. */}
        <Tooltip label="Run the workflow" align="end">
          <button type="button" className="appbar__primary" onClick={onRun}>
            <Icon name="Play" size="large" />
            <span className="appbar__label">Run</span>
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
