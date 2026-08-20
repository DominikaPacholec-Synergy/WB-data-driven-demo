import { useMemo } from "react";
import {
  Icon,
  useWorkflowBuilderActions,
  type WBIcon,
} from "@workflowbuilder/sdk";

import { Dropdown } from "../components/Dropdown";
import { Tooltip } from "../components/Tooltip";
import { setMode } from "../config/theme";
import { useThemeMode } from "../config/useThemeMode";
import { useProvenanceStore } from "../plugins/provenance";
import { ThemeSwitch } from "./ThemeSwitch";
import type {
  ProfileId,
  ProfileIndexEntry,
  ProfileMeta,
  ThemeMode,
} from "../config/types";

type Props = {
  profiles: ProfileIndexEntry[];
  profileId: ProfileId | null;
  chrome: ProfileMeta["chrome"];
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
    <header className="appbar">
      <div className="appbar__left">
        <div className="appbar__brand">
          <Icon name="WorkflowBuilderLogo" size="medium" />
          <span className="appbar__tagline">{chrome.tagline}</span>
        </div>

        <nav className="appbar__nav">
          {chrome.nav.map((item) => (
            <Tooltip key={item.id} label={item.label} align="start">
              <button
                type="button"
                aria-current={route === item.id}
                className={route === item.id ? "is-active" : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <Icon name={item.icon as WBIcon} size="large" />
                <span className="appbar__label">{item.label}</span>
                {item.id === "tasks" && pendingTasks > 0 ? (
                  <span className="appbar__count">{pendingTasks}</span>
                ) : null}
              </button>
            </Tooltip>
          ))}
        </nav>
      </div>

      <div className="appbar__field appbar__profile">
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
            className={provenance ? "appbar__toggled" : undefined}
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
            className={studioOpen ? "appbar__toggled" : undefined}
            onClick={onToggleStudio}
          >
            <Icon name="Faders" size="large" />
            <span className="appbar__label">Config Studio</span>
          </button>
        </Tooltip>
        <Tooltip label="Run the workflow" align="end">
          <button type="button" className="appbar__primary" onClick={onRun}>
            <Icon name="Play" size="large" />
            <span className="appbar__label">Run</span>
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
