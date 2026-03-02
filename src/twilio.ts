import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { insertTask } from "./data_model/index.js";
import type { Task } from "./data_model/index.js";

// ── Config ────────────────────────────────────────────────

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error("TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER must be set");
  }
  return { accountSid, authToken, phoneNumber };
}

// ── SMS Sending ───────────────────────────────────────────

const SMS_MAX_LENGTH = 1600;

async function sendSms(to: string, body: string): Promise<void> {
  const { accountSid, authToken, phoneNumber } = getTwilioConfig();
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const truncated = body.length > SMS_MAX_LENGTH
    ? body.slice(0, SMS_MAX_LENGTH - 3) + "..."
    : body;

  const params = new URLSearchParams({
    To: to,
    From: phoneNumber,
    Body: truncated,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio API error ${res.status}: ${text}`);
  }
}

// ── Task completion notification ──────────────────────────

export async function notifyTaskComplete(task: Task): Promise<void> {
  if (task.metadata?.source !== "sms" || !task.metadata?.phone) return;

  const phone = task.metadata.phone as string;
  const body = task.status === "done"
    ? task.result || "(no output)"
    : `Task failed: ${task.error || "unknown error"}`;

  try {
    await sendSms(phone, body);
    console.log(`[twilio] Sent SMS reply to ${phone} for task ${task.id}`);
  } catch (err) {
    console.error(`[twilio] Failed to send SMS to ${phone}:`, err);
  }
}

// ── Webhook Server ────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function twiml(res: ServerResponse, message: string) {
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(`<Response><Message>${escapeXml(message)}</Message></Response>`);
}

async function handleIncomingSms(req: IncomingMessage, res: ServerResponse) {
  const body = await readBody(req);
  const params = new URLSearchParams(body);

  const from = params.get("From");
  const messageBody = params.get("Body")?.trim();

  if (!from || !messageBody) {
    twiml(res, "Missing message body.");
    return;
  }

  try {
    const task = await insertTask({
      instruction: messageBody,
      metadata: { source: "sms", phone: from },
    });
    console.log(`[twilio] SMS from ${from} → task ${task.id}: "${messageBody.slice(0, 60)}"`);
    twiml(res, `Task queued: ${task.id}`);
  } catch (err) {
    console.error("[twilio] Failed to insert task from SMS:", err);
    twiml(res, "Failed to queue task.");
  }
}

export function startTwilioWebhook(port: number): Promise<void> {
  // Validate config early
  getTwilioConfig();

  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const url = req.url ?? "/";
      const method = req.method ?? "GET";

      if (method === "POST" && url === "/sms") {
        await handleIncomingSms(req, res);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, () => {
      console.log(`[twilio] Webhook listening on port ${port}`);
      resolve();
    });
  });
}
