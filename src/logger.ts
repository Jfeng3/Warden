import { insertLog } from "./db.js";

// Maps AgentSessionEvent types to execution_log rows.
// This is a best-effort logger — failures are logged to console but don't crash the runner.

export function createEventLogger(taskId: string, sessionId: string) {
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalCostUsd = 0;

  async function log(event: Record<string, unknown>) {
    const eventType = event.type as string;
    if (!eventType) return;

    try {
      switch (eventType) {
        case "tool_execution_start": {
          const toolEvent = event as {
            toolName?: string;
            args?: Record<string, unknown>;
          };
          await insertLog({
            task_id: taskId,
            session_id: sessionId,
            event_type: "tool_start",
            tool_name: toolEvent.toolName ?? null,
            tool_args: toolEvent.args ?? null,
            tool_result: null,
            text_delta: null,
            tokens_in: null,
            tokens_out: null,
            cost_usd: null,
          });
          break;
        }

        case "tool_execution_end": {
          const toolEvent = event as {
            toolName?: string;
            result?: string;
          };
          await insertLog({
            task_id: taskId,
            session_id: sessionId,
            event_type: "tool_end",
            tool_name: toolEvent.toolName ?? null,
            tool_args: null,
            tool_result:
              typeof toolEvent.result === "string"
                ? toolEvent.result.slice(0, 10000)
                : null,
            text_delta: null,
            tokens_in: null,
            tokens_out: null,
            cost_usd: null,
          });
          break;
        }

        case "turn_end": {
          const turnEvent = event as {
            usage?: { inputTokens?: number; outputTokens?: number };
            cost?: number;
          };
          const tokensIn = turnEvent.usage?.inputTokens ?? 0;
          const tokensOut = turnEvent.usage?.outputTokens ?? 0;
          const cost = turnEvent.cost ?? 0;
          totalTokensIn += tokensIn;
          totalTokensOut += tokensOut;
          totalCostUsd += cost;

          await insertLog({
            task_id: taskId,
            session_id: sessionId,
            event_type: "turn_end",
            tool_name: null,
            tool_args: null,
            tool_result: null,
            text_delta: null,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            cost_usd: cost,
          });
          break;
        }

        case "agent_end": {
          await insertLog({
            task_id: taskId,
            session_id: sessionId,
            event_type: "agent_end",
            tool_name: null,
            tool_args: null,
            tool_result: null,
            text_delta: null,
            tokens_in: totalTokensIn,
            tokens_out: totalTokensOut,
            cost_usd: totalCostUsd,
          });
          break;
        }

        // Skip high-frequency text_delta events to avoid flooding Supabase.
        // The final assistant text is captured via the task result.
      }
    } catch (err) {
      console.error(`[logger] Failed to log event ${eventType}:`, err);
    }
  }

  function getStats() {
    return { totalTokensIn, totalTokensOut, totalCostUsd };
  }

  return { log, getStats };
}
