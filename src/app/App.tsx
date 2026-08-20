import { useEffect, useState } from "react";
import { WorkflowBuilder } from "@workflowbuilder/sdk";

import { useProfileTheme } from "../config/useProfileTheme";
import { setNodeIndex } from "../plugins/provenance";
import { configureRun, disposeEngine, startRun } from "../run/engine";
import { useRunStore } from "../run/store";
import { ConfigStudio } from "../studio/ConfigStudio";
import { ExecutionsView } from "../views/ExecutionsView";
import { TasksView } from "../views/TasksView";
import { AppBar } from "./AppBar";
import { BuilderFocus } from "./BuilderFocus";
import { useHashRoute, navigate } from "./useHashRoute";
import { useProfileRuntime } from "./useProfileRuntime";
import { INTEGRATION, PLUGINS } from "../wb/runtime";

const App = () => {
  const {
    profiles,
    profileId,
    profile,
    runtime,
    error,
    switchProfile,
    applyPaletteEdit,
  } = useProfileRuntime();

  const [studioOpen, setStudioOpen] = useState(false);
  const route = useHashRoute();
  const pendingTasks = useRunStore(
    (state) =>
      state.taskOrder.filter(
        (id) =>
          state.tasks[id].status === "pending" &&
          state.tasks[id].profileId === profileId,
      ).length,
  );

  useProfileTheme(profile?.theme);

  useEffect(() => {
    if (profile?.chrome.documentTitle)
      document.title = profile.chrome.documentTitle;
  }, [profile?.chrome.documentTitle]);

  useEffect(() => {
    if (runtime) setNodeIndex(runtime.nodeIndex);
  }, [runtime?.nodeIndex]);

  useEffect(() => {
    configureRun(profileId ?? "", profile?.taskFields, profile?.run?.context);
  }, [profileId, profile?.taskFields, profile?.run?.context]);

  // The engine owns timers outside React; make sure a teardown clears them.
  useEffect(() => disposeEngine, []);

  if (error) {
    return (
      <div className="boot boot--error">
        <h1>The config backend did not answer</h1>
        <p>{error}</p>
        <p className="boot__hint">
          The editor is configured over HTTP by <code>GET /api/profiles</code>.
          Check the Vite middleware in <code>vite-plugins/config-api.ts</code>.
        </p>
      </div>
    );
  }

  if (!runtime || !profile) {
    return <div className="boot">Loading editor configuration…</div>;
  }

  const onBuilder = route === "builder";

  const run = () => {
    startRun(runtime.name);
  };

  return (
    <div className="app">
      <WorkflowBuilder.Root
        key={runtime.rootKey}
        name={runtime.name}
        layoutDirection={runtime.layoutDirection}
        nodeTypes={runtime.nodeTypes}
        initialNodes={runtime.initialNodes}
        initialEdges={runtime.initialEdges}
        plugins={PLUGINS}
        jsonForm={runtime.jsonForm}
        integration={INTEGRATION}
      >
        <div className="shell">
          <div
            className={`shell__canvas${onBuilder ? "" : " is-parked"}`}
            aria-hidden={!onBuilder}
          >
            <WorkflowBuilder.Canvas />
          </div>

          <div className="shell__chrome">
            <div className="shell__header">
              <AppBar
                profiles={profiles}
                profileId={profileId}
                chrome={profile.chrome}
                route={route}
                studioOpen={studioOpen}
                pendingTasks={pendingTasks}
                onNavigate={navigate}
                onSwitchProfile={switchProfile}
                onToggleStudio={() => setStudioOpen((open) => !open)}
                onRun={run}
              />
            </div>

            <BuilderFocus active={onBuilder} />

            <div className="shell__stage">
              <div
                className={`shell__panels${onBuilder ? "" : " is-parked"}`}
                aria-hidden={!onBuilder}
              >
                <aside className="shell__palette">
                  <WorkflowBuilder.Palette />
                </aside>

                <div id="viewport-bounds" className="shell__viewport-bounds" />
                <aside className="shell__properties">
                  <WorkflowBuilder.PropertiesPanel />
                </aside>
              </div>

              {onBuilder ? null : (
                <div className="shell__view">
                  {route === "tasks" ? (
                    <TasksView
                      profileId={profile.id}
                      facts={profile.run?.facts ?? []}
                    />
                  ) : null}
                  {route === "executions" ? (
                    <ExecutionsView profileId={profile.id} />
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </WorkflowBuilder.Root>

      {studioOpen ? (
        <ConfigStudio
          profile={profile}
          onApplyPalette={applyPaletteEdit}
          onClose={() => setStudioOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default App;
