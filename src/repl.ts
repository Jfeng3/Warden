import { createInterface, type Interface } from "node:readline";
import { insertTask } from "./data_model/index.js";
import { markNewSession } from "./session-store.js";

let rl: Interface | null = null;

export function reprompt() {
  if (rl) rl.prompt();
}

export function startRepl() {
  rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "warden> ",
  });

  console.log("Warden REPL. Tasks are queued to Supabase. /new = reset session, /quit = exit.");
  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl!.prompt();
      return;
    }

    if (input === "/quit" || input === "/exit") {
      console.log("Goodbye.");
      rl!.close();
      process.exit(0);
    }

    if (input === "/new") {
      markNewSession("repl");
      console.log("Session reset. Starting fresh.");
      rl!.prompt();
      return;
    }

    try {
      const task = await insertTask({ instruction: input, metadata: { source: "repl" } });
      console.log(`Task queued: ${task.id}`);
    } catch (err) {
      console.error("Failed to queue task:", err);
    }
    rl!.prompt();
  });

  rl.on("SIGINT", () => {
    console.log("\nGoodbye.");
    process.exit(0);
  });
}
