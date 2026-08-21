import {
  type WorkflowBuilderEdge,
  type WorkflowBuilderNode,
  getStoreDataForIntegration,
} from '@workflowbuilder/sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { compileProfile } from '@/config/compile-profile/compile-profile';
import { loadIndex, loadProfile } from '@/config/load-profile';
import type { PaletteConfig } from '@/config/types/palette';
import type { EditorProfile, ProfileId, ProfileIndexEntry } from '@/config/types/profile';
import { CUSTOM_RENDERERS, JSON_FORM } from '@/wb/runtime';

type Snapshot = {
  nodes: WorkflowBuilderNode[];
  edges: WorkflowBuilderEdge[];
} | null;

export const useProfileRuntime = () => {
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
      jsonForm: compiled.translations
        ? { renderers: CUSTOM_RENDERERS, translations: compiled.translations }
        : JSON_FORM,
      rootKey: `${compiled.id}:${revision}`,
    };
  }, [compiled, revision]);

  const identityChanges = useRef(0);
  useEffect(() => {
    if (!import.meta.env.DEV || !runtime) return;
    identityChanges.current += 1;
    console.debug(`[stability] nodeTypes identity change #${identityChanges.current}`);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime?.nodeTypes]);

  return {
    profiles,
    profileId,
    profile,
    runtime,
    error,
    switchProfile,
    applyPaletteEdit,
  };
};
