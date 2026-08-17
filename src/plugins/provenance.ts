import { create } from 'zustand';

import type { NodeConfig } from '../config/types';

/**
 * "Which JSON produced this node?" — a toggle that annotates every node on the
 * canvas with the palette entry it was compiled from.
 *
 * It is the article's figure made interactive: instead of asserting that the
 * canvas is generated from config, the reader can switch the labels on and read
 * the config keys off the diagram.
 */

type ProvenanceState = {
  enabled: boolean;
  toggle: () => void;
};

export const useProvenanceStore = create<ProvenanceState>((set) => ({
  enabled: false,
  toggle: () => set((state) => ({ enabled: !state.enabled })),
}));

/**
 * The compiled palette index, held at module scope because the node decorator
 * cannot receive props. Set by App whenever the profile recompiles.
 */
let nodeIndex: Map<string, NodeConfig> = new Map();

export function setNodeIndex(index: Map<string, NodeConfig>): void {
  nodeIndex = index;
}

export function lookupNodeConfig(type: string): NodeConfig | undefined {
  return nodeIndex.get(type);
}
