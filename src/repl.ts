import { createInterface, type Interface } from "node:readline";
import { insertTask } from "./data_model/index.js";

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

  console.log("Warden REPL. Tasks are queued to Supabase. Type /quit to exit.");
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

    try {
      const task = await insertTask({ instruction: input });
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
