import { Bot } from "grammy";
import { insertTask } from "./data_model/index.js";
import type { Task } from "./data_model/index.js";

let bot: Bot | null = null;

// ── Telegram Bot ──────────────────────────────────────────

export function startTelegram(): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN must be set");
  }

  bot = new Bot(token);

  bot.on("message:text", async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text.trim();
    if (!text) return;

    try {
      const task = await insertTask({
        instruction: text,
        metadata: { source: "telegram", chatId },
      });
      console.log(`[telegram] Message from ${chatId} → task ${task.id}: "${text.slice(0, 60)}"`);
      await ctx.reply(`Task queued: ${task.id}`);
    } catch (err) {
      console.error("[telegram] Failed to insert task:", err);
      await ctx.reply("Failed to queue task.").catch(() => {});
    }
  });

  bot.catch((err) => {
    console.error("[telegram] Bot error:", err);
  });

  bot.start();
  console.log("[telegram] Bot started (long polling)");
}

export function stopTelegram(): void {
  if (bot) {
    bot.stop();
    console.log("[telegram] Bot stopped");
  }
}

// ── Task completion notification ──────────────────────────

const TELEGRAM_MAX_LENGTH = 4096;

export async function notifyTaskComplete(task: Task): Promise<void> {
  if (!bot || task.metadata?.source !== "telegram" || !task.metadata?.chatId) return;

  const chatId = task.metadata.chatId as number;
  const body = task.status === "done"
    ? task.result || "(no output)"
    : `Task failed: ${task.error || "unknown error"}`;

  const truncated = body.length > TELEGRAM_MAX_LENGTH
    ? body.slice(0, TELEGRAM_MAX_LENGTH - 3) + "..."
    : body;

  try {
    await bot.api.sendMessage(chatId, truncated);
    console.log(`[telegram] Sent reply to chat ${chatId} for task ${task.id}`);
  } catch (err) {
    console.error(`[telegram] Failed to send reply to chat ${chatId}:`, err);
  }
}
