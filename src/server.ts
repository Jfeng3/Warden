import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { insertTask } from "./data_model/index.js";
import type { TaskInput } from "./data_model/index.js";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function handleCreateTask(req: IncomingMessage, res: ServerResponse) {
  const body = await readBody(req);

  let input: TaskInput;
  try {
    input = JSON.parse(body);
  } catch {
    json(res, 400, { error: "Invalid JSON" });
    return;
  }

  if (!input.instruction) {
    json(res, 400, { error: "Missing instruction" });
    return;
  }

  try {
    const task = await insertTask(input);
    console.log(`[server] Task created: ${task.id} — "${task.instruction.slice(0, 60)}"`);
    json(res, 200, { task_id: task.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[server] Failed to insert task:`, msg);
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
        if (method === "POST" && url === "/api/task") {
          await handleCreateTask(req, res);
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
