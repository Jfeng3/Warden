import "dotenv/config";
import { parseCliArgs, getEffectiveConfig } from "./config.js";
import { startRunner, stopRunner } from "./runner.js";
import { startRepl } from "./repl.js";

async function main() {
  const cliArgs = parseCliArgs(process.argv.slice(2));
  const { provider, model } = getEffectiveConfig(cliArgs.provider, cliArgs.model);

  console.log(`Warden starting — provider: ${provider}, model: ${model}`);

  // Start task runner (polls Supabase for queued tasks)
  await startRunner(provider, model);

  // Start interactive REPL
  startRepl();
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM, shutting down...");
  stopRunner();
  process.exit(0);
});

process.on("SIGINT", () => {
  // Let REPL handle first Ctrl+C; force exit on second
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
