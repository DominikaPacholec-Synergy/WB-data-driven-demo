import { create } from 'zustand';

import type { NodeConfig } from '@/config/types/palette';

/**
 * "Which JSON produced this node?" — a toggle that annotates every node on the
 * canvas with the palette entry it was compiled from.
 */

type ProvenanceState = {
  enabled: boolean;
  toggle: () => void;
};

export const useProvenanceStore = create<ProvenanceState>((set) => ({
  enabled: false,
  toggle: () => set((state) => ({ enabled: !state.enabled })),
}));

let nodeIndex: Map<string, NodeConfig> = new Map();

export const setNodeIndex = (index: Map<string, NodeConfig>): void => {
  nodeIndex = index;
};

export const lookupNodeConfig = (type: string): NodeConfig | undefined => {
  return nodeIndex.get(type);
};
