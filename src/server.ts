import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { createHmac } from "node:crypto";
import { insertTask } from "./db.js";
import { getSigningKeys } from "./queue.js";
import type { TaskPayload } from "./types.js";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function verifySignature(body: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const { currentSigningKey, nextSigningKey } = getSigningKeys();
  if (!currentSigningKey && !nextSigningKey) {
    // No signing keys configured — skip verification (dev mode)
    console.warn("[server] No QStash signing keys configured, skipping verification");
    return true;
  }
  for (const key of [currentSigningKey, nextSigningKey]) {
    if (!key) continue;
    const expected = createHmac("sha256", key).update(body).digest("base64");
    if (expected === signature) return true;
  }
  return false;
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function handleTaskWebhook(req: IncomingMessage, res: ServerResponse) {
  const body = await readBody(req);
  const signature = req.headers["upstash-signature"] as string | undefined;

  if (!verifySignature(body, signature)) {
    json(res, 401, { error: "Invalid signature" });
    return;
  }

  let payload: TaskPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    json(res, 400, { error: "Invalid JSON" });
    return;
  }

  if (!payload.prompt) {
    json(res, 400, { error: "Missing prompt" });
    return;
  }

  try {
    const task = await insertTask(payload);
    console.log(`[server] Task queued: ${task.id} — "${task.prompt.slice(0, 60)}"`);
    json(res, 200, { task_id: task.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Idempotency conflict — task already exists, that's fine
    if (msg.includes("duplicate key") || msg.includes("unique")) {
      console.log(`[server] Duplicate task (idempotency_key), ignoring`);
      json(res, 200, { deduplicated: true });
      return;
    }
    console.error(`[server] Failed to insert task:`, msg);
    json(res, 500, { error: msg });
  }
}

async function handleScheduleWebhook(req: IncomingMessage, res: ServerResponse) {
  const body = await readBody(req);
  const signature = req.headers["upstash-signature"] as string | undefined;

  if (!verifySignature(body, signature)) {
    json(res, 401, { error: "Invalid signature" });
    return;
  }

  let payload: { prompt: string; context?: Record<string, unknown>; schedule_name?: string };
  try {
    payload = JSON.parse(body);
  } catch {
    json(res, 400, { error: "Invalid JSON" });
    return;
  }

  if (!payload.prompt) {
    json(res, 400, { error: "Missing prompt" });
    return;
  }

  try {
    const task = await insertTask({
      prompt: payload.prompt,
      context: { ...payload.context, schedule_name: payload.schedule_name },
    });
    console.log(`[server] Scheduled task queued: ${task.id} (${payload.schedule_name ?? "unnamed"})`);
    json(res, 200, { task_id: task.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[server] Failed to insert scheduled task:`, msg);
    json(res, 500, { error: msg });
  }
}

function handleHealth(_req: IncomingMessage, res: ServerResponse) {
  json(res, 200, { status: "ok", timestamp: new Date().toISOString() });
}

export function startServer(port: number): Promise<void> {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const url = req.url ?? "/";
      const method = req.method ?? "GET";

      try {
        if (method === "POST" && url === "/webhook/task") {
          await handleTaskWebhook(req, res);
        } else if (method === "POST" && url === "/webhook/schedule") {
          await handleScheduleWebhook(req, res);
        } else if (method === "GET" && url === "/health") {
          handleHealth(req, res);
        } else {
          json(res, 404, { error: "Not found" });
        }
      } catch (err) {
        console.error(`[server] Unhandled error:`, err);
        json(res, 500, { error: "Internal server error" });
      }
    });

    server.listen(port, () => {
      console.log(`[server] Listening on port ${port}`);
      resolve();
    });
  });
}
