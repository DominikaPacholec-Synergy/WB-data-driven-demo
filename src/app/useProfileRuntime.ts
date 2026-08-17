import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getStoreDataForIntegration,
  type WorkflowBuilderEdge,
  type WorkflowBuilderNode,
} from '@workflowbuilder/sdk';

import { CUSTOM_RENDERERS, JSON_FORM } from '../wb/runtime';
import { compileProfile } from '../config/compileProfile';
import { loadIndex, loadProfile } from '../config/loadProfile';
import type { EditorProfile, PaletteConfig, ProfileId, ProfileIndexEntry } from '../config/types';

type Snapshot = { nodes: WorkflowBuilderNode[]; edges: WorkflowBuilderEdge[] } | null;

/**
 * Owns the profile lifecycle and, more importantly, the identity discipline the
 * SDK requires: `nodeTypes` / `initialNodes` / `diagramTemplates` must be stable
 * references, because an inline literal overwrites the SDK's module-level
 * palette holder on every parent render.
 */
export function useProfileRuntime() {
  const [profiles, setProfiles] = useState<ProfileIndexEntry[]>([]);
  const [profile, setProfile] = useState<EditorProfile | null>(null);
  const [profileId, setProfileId] = useState<ProfileId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const snapshot = useRef<Snapshot>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const index = await loadIndex();
        if (cancelled) return;
        setProfiles(index.profiles);
        const first = index.profiles[0]?.id;
        if (!first) throw new Error('The config backend returned no profiles.');
        const loaded = await loadProfile(first);
        if (cancelled) return;
        snapshot.current = null;
        setProfile(loaded);
        setProfileId(first);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Identity changes only when the profile object does — never on a slider drag. */
  const compiled = useMemo(() => (profile ? compileProfile(profile) : null), [profile]);

  /** A different profile means a different diagram, so in-progress edits are dropped. */
  const switchProfile = useCallback(
    async (id: ProfileId) => {
      if (id === profileId) return;
      try {
        const loaded = await loadProfile(id);
        snapshot.current = null;
        setProfile(loaded);
        setProfileId(id);
        setRevision((r) => r + 1);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    },
    [profileId],
  );

  /**
   * Applying a schema edit needs a remount: `nodeTypes` lives in a module-level
   * holder and `initialNodes` is documented as first-mount-only, so the SDK will
   * not pick up a changed schema in place. Snapshotting the live diagram first
   * and feeding it back as `initialNodes` makes the remount invisible — the
   * canvas is untouched, the schema is new, and the SDK re-validates the
   * existing nodes against it on mount.
   */
  const applyPaletteEdit = useCallback((palette: PaletteConfig) => {
    const live = getStoreDataForIntegration();
    snapshot.current = { nodes: live.nodes, edges: live.edges };
    setProfile((previous) => (previous ? { ...previous, palette } : previous));
    setRevision((r) => r + 1);
  }, []);

  const runtime = useMemo(() => {
    if (!compiled) return null;
    return {
      ...compiled,
      initialNodes: snapshot.current?.nodes ?? compiled.initialNodes,
      initialEdges: snapshot.current?.edges ?? compiled.initialEdges,
      /*
       * Built here so its identity is tied to the profile object, exactly like
       * `nodeTypes`. `translations` is the only part that varies per profile, so
       * profiles without any share the module-level constant.
       */
      jsonForm: compiled.translations
        ? { renderers: CUSTOM_RENDERERS, translations: compiled.translations }
        : JSON_FORM,
      rootKey: `${compiled.id}:${revision}`,
    };
  }, [compiled, revision]);

  // Dev-only tripwire for the stable-reference rule. One line per profile swap
  // is correct; a burst means something is rebuilding nodeTypes on every render.
  const identityChanges = useRef(0);
  useEffect(() => {
    if (!import.meta.env.DEV || !runtime) return;
    identityChanges.current += 1;
    console.debug(`[stability] nodeTypes identity change #${identityChanges.current}`);
  }, [runtime?.nodeTypes]);

  return { profiles, profileId, profile, runtime, error, switchProfile, applyPaletteEdit };
}
