import { createInterface } from "node:readline";
import { createAgentSession, DefaultResourceLoader, SessionManager, type AgentSession } from "@mariozechner/pi-coding-agent";
import { resolveModel } from "./config.js";
import { insertTask } from "./db.js";
import { SYSTEM_PROMPT } from "./prompt.js";

type ReplMode = "direct" | "queue";

async function createDirectSession(provider: string, modelId: string): Promise<AgentSession> {
  const model = resolveModel(provider, modelId);
  const resourceLoader = new DefaultResourceLoader({
    systemPrompt: SYSTEM_PROMPT,
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noThemes: true,
  });
  await resourceLoader.reload();

  const { session } = await createAgentSession({
    model,
    sessionManager: SessionManager.inMemory(),
    resourceLoader,
  });
  return session;
}

export async function startRepl(
  provider: string,
  modelId: string,
  mode: ReplMode = "direct"
) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: mode === "direct" ? "warden> " : "warden [queue]> ",
  });

  let session: AgentSession | null = null;
  let isProcessing = false;

  function attachSessionListeners(s: AgentSession) {
    s.subscribe((event) => {
      if (event.type === "message_update") {
        const msgEvent = (event as any).assistantMessageEvent as
          | { type: string; delta?: string }
          | undefined;
        if (msgEvent?.type === "text_delta" && msgEvent.delta) {
          process.stdout.write(msgEvent.delta);
        }
      } else if (event.type === "tool_execution_start") {
        const toolEvent = event as any;
        console.log(`\n[tool] ${toolEvent.toolName ?? "unknown"}`);
      } else if (event.type === "agent_end") {
        console.log(); // newline after response
        rl.prompt();
      }
    });
  }

  if (mode === "direct") {
    session = await createDirectSession(provider, modelId);
    attachSessionListeners(session);
  }

  console.log(
    mode === "direct"
      ? "Warden REPL (direct mode). Type /quit to exit, /queue to switch to queue mode."
      : "Warden REPL (queue mode). Tasks are queued to Supabase. Type /quit to exit, /direct to switch."
  );
  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    // Commands
    if (input === "/quit" || input === "/exit") {
      console.log("Goodbye.");
      rl.close();
      process.exit(0);
    }

    if (input === "/queue") {
      mode = "queue";
      rl.setPrompt("warden [queue]> ");
      console.log("Switched to queue mode. Tasks will be queued to Supabase.");
      rl.prompt();
      return;
    }

    if (input === "/direct") {
      if (!session) {
        session = await createDirectSession(provider, modelId);
        attachSessionListeners(session);
      }
      mode = "direct";
      rl.setPrompt("warden> ");
      console.log("Switched to direct mode. Responses stream directly.");
      rl.prompt();
      return;
    }

    if (mode === "queue") {
      try {
        const task = await insertTask({ prompt: input });
        console.log(`Task queued: ${task.id}`);
      } catch (err) {
        console.error("Failed to queue task:", err);
      }
      rl.prompt();
      return;
    }

    // Direct mode
    if (isProcessing) {
      console.log("(still processing previous prompt, please wait)");
      return;
    }

    if (session) {
      isProcessing = true;
      try {
        await session.prompt(input);
      } catch (err) {
        console.error("Error:", err);
        rl.prompt();
      } finally {
        isProcessing = false;
      }
    }
  });

  // Ctrl+C handling
  rl.on("SIGINT", () => {
    if (isProcessing) {
      console.log("\n(interrupting...)");
      isProcessing = false;
      rl.prompt();
    } else {
      console.log("\nGoodbye.");
      process.exit(0);
    }
  });
}
