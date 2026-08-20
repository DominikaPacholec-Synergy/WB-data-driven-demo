import { create } from 'zustand';

/**
 * Run state for the human-in-the-loop demo.
 *
 * Deliberately OUR store, not the SDK's. Run status must not be written into
 * `node.data.properties`: `setStoreNodes` re-validates every node against its
 * schema, so a run status would both pollute the document the integration saves
 * and risk tripping validation. Keeping it here, keyed by node id, means the
 * design-time document stays exactly what the config described.
 *
 * It is a module singleton so a run suspended on a human task survives
 * navigation between views — that is the whole point of "durable" execution,
 * even simulated.
 */

export type NodeRunStatus = 'running' | 'done' | 'waiting' | 'rejected' | 'skipped';

export type ExecutionStatus = 'running' | 'waiting' | 'completed' | 'rejected' | 'failed';

export type TaskStatus = 'pending' | 'completed' | 'rejected';

export type LogEntry = { at: string; text: string; detail?: string };

/**
 * The plan of the run: every node in the diagram, in seed order, captured when
 * the run starts. Steps a branch never reaches simply stay unvisited — which is
 * exactly what the spec's "○ Process payment" placeholder means.
 */
export type Step = { id: string; label: string };

export type Execution = {
  id: string;
  /**
   * Runs belong to the profile that started them.
   *
   * Not cosmetic: the interpreter walks the diagram that is currently in the SDK
   * store, so resuming a task created under another profile would advance it
   * across a completely different graph. Scoping keeps each profile's inbox and
   * run list its own — the two demos are separate applications that happen to
   * share a shell.
   */
  profileId: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: string;
  currentNodeId: string | null;
  steps: Step[];
  nodeStatus: Record<string, NodeRunStatus>;
  log: LogEntry[];
  /** The mocked AI result. Condition operands resolve `{{...}}` against this. */
  context: Record<string, unknown>;
};

export type Task = {
  id: string;
  profileId: string;
  execId: string;
  nodeId: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  assignee: string;
  priority: string;
  dueAfterHours: number;
  allowReject: boolean;
  reviewerNote: string;
  comment?: string;
};

type RunState = {
  executions: Record<string, Execution>;
  order: string[];
  tasks: Record<string, Task>;
  taskOrder: string[];

  createExecution: (
    execId: string,
    profileId: string,
    workflowName: string,
    steps: Step[],
    context: Record<string, unknown>,
  ) => void;
  setNodeStatus: (execId: string, nodeId: string, status: NodeRunStatus) => void;
  log: (execId: string, text: string, detail?: string) => void;
  setStatus: (execId: string, status: ExecutionStatus) => void;
  createTask: (task: Omit<Task, 'status' | 'createdAt'>) => void;
  closeTask: (taskId: string, status: TaskStatus, comment?: string) => void;
  clear: () => void;
};

export const stamp = (): string => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

/** Immutable per-execution patch — zustand needs a fresh object to notify. */
const patch = (state: RunState, execId: string, change: (execution: Execution) => Execution) => {
  const execution = state.executions[execId];
  if (!execution) return state;
  return { ...state, executions: { ...state.executions, [execId]: change(execution) } };
};

export const useRunStore = create<RunState>((set) => ({
  executions: {},
  order: [],
  tasks: {},
  taskOrder: [],

  createExecution: (execId, profileId, workflowName, steps, context) =>
    set((state) => ({
      executions: {
        ...state.executions,
        [execId]: {
          id: execId,
          profileId,
          workflowName,
          status: 'running',
          startedAt: stamp(),
          currentNodeId: null,
          steps,
          nodeStatus: {},
          log: [{ at: stamp(), text: 'Workflow started' }],
          context,
        },
      },
      order: [execId, ...state.order],
    })),

  setNodeStatus: (execId, nodeId, status) =>
    set((state) =>
      patch(state, execId, (execution) => ({
        ...execution,
        currentNodeId: status === 'done' ? execution.currentNodeId : nodeId,
        nodeStatus: { ...execution.nodeStatus, [nodeId]: status },
      })),
    ),

  log: (execId, text, detail) =>
    set((state) =>
      patch(state, execId, (execution) => ({
        ...execution,
        log: [...execution.log, { at: stamp(), text, detail }],
      })),
    ),

  setStatus: (execId, status) =>
    set((state) =>
      patch(state, execId, (execution) => ({
        ...execution,
        status,
        currentNodeId: status === 'running' || status === 'waiting' ? execution.currentNodeId : null,
      })),
    ),

  createTask: (task) =>
    set((state) => ({
      tasks: { ...state.tasks, [task.id]: { ...task, status: 'pending', createdAt: stamp() } },
      taskOrder: [task.id, ...state.taskOrder],
    })),

  closeTask: (taskId, status, comment) =>
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;
      return { tasks: { ...state.tasks, [taskId]: { ...task, status, comment } } };
    }),

  clear: () => set({ executions: {}, order: [], tasks: {}, taskOrder: [] }),
}));
