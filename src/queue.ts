import { Client } from "@upstash/qstash";
import type { TaskPayload } from "./types.js";

let qstashClient: Client | null = null;

function getQStash(): Client {
  if (qstashClient) return qstashClient;
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error("QSTASH_TOKEN must be set");
  qstashClient = new Client({ token });
  return qstashClient;
}

function getWebhookUrl(): string {
  const url = process.env.WARDEN_WEBHOOK_URL;
  if (!url) throw new Error("WARDEN_WEBHOOK_URL must be set");
  return url;
}

export async function publishTask(payload: TaskPayload): Promise<string> {
  const response = await getQStash().publishJSON({
    url: `${getWebhookUrl()}/webhook/task`,
    body: payload,
    retries: 3,
    deduplicationId: payload.idempotency_key,
  });
  return response.messageId;
}

export async function createSchedule(opts: {
  name: string;
  cron: string;
  prompt: string;
  context?: Record<string, unknown>;
}): Promise<string> {
  const response = await getQStash().publishJSON({
    url: `${getWebhookUrl()}/webhook/schedule`,
    body: {
      prompt: opts.prompt,
      context: opts.context ?? {},
      schedule_name: opts.name,
    },
    headers: {
      "Upstash-Cron": opts.cron,
    },
  });
  return response.messageId;
}

export async function listSchedules() {
  return getQStash().schedules.list();
}

export async function removeSchedule(scheduleId: string): Promise<void> {
  await getQStash().schedules.delete(scheduleId);
}

export function getSigningKeys() {
  return {
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "",
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
  };
}
