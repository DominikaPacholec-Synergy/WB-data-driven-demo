import { Icon, useWorkflowBuilderActions, type WBIcon } from '@workflowbuilder/sdk';

import { readMode, setMode } from '../config/theme';
import { useProvenanceStore } from '../plugins/provenance';
import type { ProfileId, ProfileIndexEntry, ProfileMeta } from '../config/types';

type Props = {
  profiles: ProfileIndexEntry[];
  profileId: ProfileId | null;
  chrome: ProfileMeta['chrome'];
  workflowName: string;
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
 */
export function AppBar({
  profiles,
  profileId,
  chrome,
  workflowName,
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

  const toggleTheme = () => {
    const next = readMode() === 'dark' ? 'light' : 'dark';
    setMode(next);
    // Keep the SDK's internal subscribers in step with the attribute we just set.
    actions.setTheme(next);
  };

  return (
    <header className="appbar">
      <div className="appbar__brand">
        <Icon name="WorkflowBuilderLogo" size="medium" />
        <div>
          <strong>{chrome.productName}</strong>
          {chrome.tagline ? <span className="appbar__tagline">{chrome.tagline}</span> : null}
        </div>
      </div>

      <nav className="appbar__nav">
        {chrome.nav.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={route === item.id}
            className={route === item.id ? 'is-active' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {/* Config keeps icons as plain strings so the JSON stays pure; the
                cast is the one boundary where that string becomes a WBIcon. */}
            <Icon name={item.icon as WBIcon} size="small" />
            {item.label}
            {item.id === 'tasks' && pendingTasks > 0 ? (
              <span className="appbar__count">{pendingTasks}</span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="appbar__title">
        <Icon name="FlowArrow" size="small" />
        <span>{workflowName}</span>
      </div>

      <div className="appbar__actions">
        <label className="appbar__field">
          <span>Profile</span>
          <select
            value={profileId ?? ''}
            onChange={(event) => onSwitchProfile(event.target.value)}
            title="Everything below is described by the JSON this profile serves"
          >
            {profiles.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={toggleTheme} title="Toggle light / dark">
          <Icon name="Moon" size="small" />
        </button>
        <button type="button" onClick={() => actions.toggleLayoutDirection({ fitView: true })}>
          Flip layout
        </button>
        <button
          type="button"
          aria-pressed={provenance}
          className={provenance ? 'appbar__toggled' : undefined}
          onClick={toggleProvenance}
          title="Label every node with the config entry it was compiled from"
        >
          <Icon name="Fingerprint" size="small" />
        </button>
        <button
          type="button"
          aria-pressed={studioOpen}
          className={studioOpen ? 'appbar__toggled' : undefined}
          onClick={onToggleStudio}
        >
          <Icon name="Faders" size="small" />
          Config Studio
        </button>
        <button type="button" onClick={() => void actions.save()}>
          Save
        </button>
        <button type="button" className="appbar__primary" onClick={onRun}>
          <Icon name="Play" size="small" />
          Run
        </button>
      </div>
    </header>
  );
}
