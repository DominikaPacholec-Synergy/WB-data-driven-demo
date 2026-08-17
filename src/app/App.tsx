import { useEffect, useState } from 'react';
import { WorkflowBuilder } from '@workflowbuilder/sdk';

import { useProfileTheme } from '../config/useProfileTheme';
import { setNodeIndex } from '../plugins/provenance';
import { configureRun, disposeEngine, startRun } from '../run/engine';
import { useRunStore } from '../run/store';
import { ConfigStudio } from '../studio/ConfigStudio';
import { ExecutionsView } from '../views/ExecutionsView';
import { TasksView } from '../views/TasksView';
import { AppBar } from './AppBar';
import { BuilderFocus } from './BuilderFocus';
import { useHashRoute, navigate } from './useHashRoute';
import { useProfileRuntime } from './useProfileRuntime';
import { INTEGRATION, PLUGINS } from '../wb/runtime';

export default function App() {
  const { profiles, profileId, profile, runtime, error, switchProfile, applyPaletteEdit } =
    useProfileRuntime();
  /**
   * Safe as component state: `runtime` is memoised on the profile object, so
   * toggling the dock re-renders this component without minting a new
   * `nodeTypes` identity. The dev tripwire in `useProfileRuntime` proves it.
   */
  const [studioOpen, setStudioOpen] = useState(false);
  const route = useHashRoute();
  const pendingTasks = useRunStore(
    (state) =>
      state.taskOrder.filter(
        (id) => state.tasks[id].status === 'pending' && state.tasks[id].profileId === profileId,
      ).length,
  );

  useProfileTheme(profile?.theme);

  useEffect(() => {
    if (profile?.chrome.documentTitle) document.title = profile.chrome.documentTitle;
  }, [profile?.chrome.documentTitle]);

  // The node decorator takes no props, so the compiled index goes via a holder.
  useEffect(() => {
    if (runtime) setNodeIndex(runtime.nodeIndex);
  }, [runtime?.nodeIndex]);

  // The engine is a plain module; hand it the active profile's run vocabulary.
  useEffect(() => {
    configureRun(profileId ?? '', profile?.taskFields, profile?.run?.context);
  }, [profileId, profile?.taskFields, profile?.run?.context]);

  // The engine owns timers outside React; make sure a teardown clears them.
  useEffect(() => disposeEngine, []);

  if (error) {
    return (
      <div className="boot boot--error">
        <h1>The config backend did not answer</h1>
        <p>{error}</p>
        <p className="boot__hint">
          The editor is configured over HTTP by <code>GET /api/profiles</code>. Check the Vite
          middleware in <code>vite-plugins/config-api.ts</code>.
        </p>
      </div>
    );
  }

  if (!runtime || !profile) {
    return <div className="boot">Loading editor configuration…</div>;
  }

  const onBuilder = route === 'builder';

  const run = () => {
    const execId = startRun(runtime.name);
    navigate(execId ? 'executions' : 'builder');
  };

  return (
    /*
     * The Studio sits OUTSIDE <Root> on purpose.
     *
     * Applying a schema edit bumps `rootKey`, which remounts everything below
     * Root. With the dock inside, every Apply wiped its own tab selection,
     * editor buffer and result message — the panel destroyed itself with the
     * click that made it useful. It needs no Root context (only AppBar does),
     * so hoisting it out is both the fix and the honest structure.
     */
    <div className="app">
      {/**
       * One Root per page — plugin, JsonForms and i18n registries plus the store
       * facade are module-level singletons, so a second Root would silently clash.
       * That is why Tasks and Executions are views inside this shell rather than
       * separate pages with a second canvas.
       *
       * `key` forces a clean remount when the profile or the schema revision
       * changes, which is the only way the SDK re-reads `initialNodes`.
       */}
      <WorkflowBuilder.Root
        key={runtime.rootKey}
        name={runtime.name}
        layoutDirection={runtime.layoutDirection}
        nodeTypes={runtime.nodeTypes}
        initialNodes={runtime.initialNodes}
        initialEdges={runtime.initialEdges}
        diagramTemplates={runtime.diagramTemplates}
        plugins={PLUGINS}
        jsonForm={runtime.jsonForm}
        integration={INTEGRATION}
      >
        <div className="shell">
          <AppBar
            profiles={profiles}
            profileId={profileId}
            chrome={profile.chrome}
            workflowName={runtime.name}
            route={route}
            studioOpen={studioOpen}
            pendingTasks={pendingTasks}
            onNavigate={navigate}
            onSwitchProfile={switchProfile}
            onToggleStudio={() => setStudioOpen((open) => !open)}
            onRun={run}
          />

          <BuilderFocus active={onBuilder} />

          {/*
           * The builder is never unmounted — a run parked on a human task, the
           * viewport and any in-progress edits all have to survive a trip to the
           * inbox. Parking it keeps its measured size; `display: none` would make
           * xyflow measure zero and come back broken.
           */}
          <div className={`shell__body${onBuilder ? '' : ' is-parked'}`} aria-hidden={!onBuilder}>
            <aside className="shell__palette">
              <WorkflowBuilder.Palette />
            </aside>
            <main className="shell__canvas">
              <WorkflowBuilder.Canvas />
            </main>
            <aside className="shell__properties">
              <WorkflowBuilder.PropertiesPanel />
            </aside>
          </div>

          {onBuilder ? null : (
            <div className="shell__view">
              {route === 'tasks' ? (
                <TasksView profileId={profile.id} facts={profile.run?.facts ?? []} />
              ) : null}
              {route === 'executions' ? <ExecutionsView profileId={profile.id} /> : null}
            </div>
          )}
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
}
