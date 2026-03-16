import { Type } from "@sinclair/typebox";
import type { ToolDefinition } from "@mariozechner/pi-coding-agent";

/**
 * In-memory key-value store that flows between workflow steps.
 * Each multi-step task gets its own instance.
 */
export class WorkflowState {
  private data: Record<string, unknown> = {};

  set(key: string, value: unknown): void {
    this.data[key] = value;
  }

  get(key: string): unknown {
    return this.data[key];
  }

  getAll(): Record<string, unknown> {
    return { ...this.data };
  }

  /** Format state as a text block for prepending to step instructions */
  toContext(): string {
    const entries = Object.entries(this.data);
    if (entries.length === 0) return "";
    const lines = entries.map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`);
    return `## Workflow State (from previous steps)\n\n${lines.join("\n")}\n\nUse the get_state tool to read specific values. Use set_state to persist data for subsequent steps.`;
  }
}

const SetStateParams = Type.Object({
  key: Type.String({ description: "State key to set (e.g. 'topic_slug', 'draft_path', 'eval_score')" }),
  value: Type.Unknown({ description: "Value to store. Use strings, numbers, booleans, or JSON-serializable objects." }),
});

const GetStateParams = Type.Object({
  key: Type.Optional(Type.String({ description: "Specific key to retrieve. Omit to get all state." })),
});

/**
 * Create set_state and get_state tools bound to a WorkflowState instance.
 */
export function createStateTools(state: WorkflowState): ToolDefinition<any>[] {
  const setStateTool: ToolDefinition<typeof SetStateParams> = {
    name: "set_state",
    label: "Set Workflow State",
    description:
      "Persist a key-value pair to workflow state. This data survives across steps — use it for topic names, file paths, scores, issue lists, or any lightweight structured data that the next step needs. File contents should stay on disk; only store references here.",
    parameters: SetStateParams,
    async execute(_toolCallId, params) {
      state.set(params.key, params.value);
      return {
        content: [{ type: "text" as const, text: `State updated: ${params.key} = ${JSON.stringify(params.value)}` }],
        details: undefined,
      };
    },
  };

  const getStateTool: ToolDefinition<typeof GetStateParams> = {
    name: "get_state",
    label: "Get Workflow State",
    description:
      "Retrieve workflow state from previous steps. Call with a specific key, or omit key to get all state as JSON.",
    parameters: GetStateParams,
    async execute(_toolCallId, params) {
      if (params.key) {
        const val = state.get(params.key);
        const text =
          val !== undefined
            ? `${params.key} = ${JSON.stringify(val)}`
            : `Key "${params.key}" not found in state. Available keys: ${Object.keys(state.getAll()).join(", ") || "(empty)"}`;
        return { content: [{ type: "text" as const, text }], details: undefined };
      }
      const all = state.getAll();
      const text = Object.keys(all).length > 0 ? JSON.stringify(all, null, 2) : "(state is empty)";
      return { content: [{ type: "text" as const, text }], details: undefined };
    },
  };

  return [setStateTool as any, getStateTool as any];
}
