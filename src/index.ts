import "dotenv/config";
import { parseCliArgs, getEffectiveConfig } from "./config.js";
import { startRunner, stopRunner } from "./runner.js";
import { startRepl } from "./repl.js";
import { startTelegram, stopTelegram } from "./telegram.js";
import { startCron, stopCron } from "./cron.js";

async function main() {
  const cliArgs = parseCliArgs(process.argv.slice(2));
  const { provider, model } = getEffectiveConfig(cliArgs.provider, cliArgs.model);

  console.log(`Warden starting — provider: ${provider}, model: ${model}`);

  // Start Telegram bot if configured
  if (process.env.TELEGRAM_BOT_TOKEN) {
    startTelegram();
  }

  // Start cron scheduler
  startCron();

  // Start task runner (polls Supabase for queued tasks)
  await startRunner(provider, model);

  // Start interactive REPL
  startRepl();
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM, shutting down...");
  stopCron();
  stopTelegram();
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
