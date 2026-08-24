import type { LayoutDirection } from '@workflowbuilder/sdk';

export type SeedNode = {
  id: string;
  nodeType: string;
  position: { x: number; y: number };
  properties?: Record<string, unknown>;
};

export type SeedEdge = {
  id: string;
  source: string;
  target: string;
  sourceBranch?: string;
  label?: string;
  icon?: string;
};

export type Seed = { nodes: SeedNode[]; edges: SeedEdge[] };

export type WorkflowConfig = {
  name: string;
  layoutDirection: LayoutDirection;
  seed: Seed;
};
