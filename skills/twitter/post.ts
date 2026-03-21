#!/usr/bin/env npx tsx
/**
 * Post a tweet using X API v2 with OAuth 1.0a authentication.
 * Uses only built-in Node.js modules — no external dependencies.
 *
 * Usage:
 *   npx tsx skills/twitter/post.ts "Your tweet text here"
 *   echo "Your tweet text" | npx tsx skills/twitter/post.ts
 *
 * Env vars required:
 *   TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET,
 *   TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET
 *
 * Outputs JSON response from X API on success, exits 1 on failure.
 */

import crypto from "crypto";
import https from "https";

// ── Env ──────────────────────────────────────────────────────────────
const CONSUMER_KEY = env("TWITTER_CONSUMER_KEY");
const CONSUMER_SECRET = env("TWITTER_CONSUMER_SECRET");
const ACCESS_TOKEN = env("TWITTER_ACCESS_TOKEN");
const ACCESS_TOKEN_SECRET = env("TWITTER_ACCESS_TOKEN_SECRET");

function env(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Error: ${name} is not set`);
    process.exit(1);
  }
  return v;
}

// ── OAuth 1.0a signing ───────────────────────────────────────────────
function percentEncode(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildOAuthHeader(method: string, url: string): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  // Build signature base string (no query params for this endpoint)
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const baseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(CONSUMER_SECRET)}&${percentEncode(ACCESS_TOKEN_SECRET)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  oauthParams["oauth_signature"] = signature;

  const header = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${header}`;
}

// ── Read tweet text ──────────────────────────────────────────────────
async function getTweetText(): Promise<string> {
  if (process.argv[2]) return process.argv[2];

  // Read from stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString().trim();
  if (!text) {
    console.error("Usage: npx tsx skills/twitter/post.ts <tweet_text>");
    process.exit(1);
  }
  return text;
}

// ── Post tweet ───────────────────────────────────────────────────────
async function postTweet(text: string): Promise<void> {
  const url = "https://api.twitter.com/2/tweets";
  const body = JSON.stringify({ text });
  const auth = buildOAuthHeader("POST", url);

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => {
          const responseBody = Buffer.concat(chunks).toString();
          console.log(responseBody);
          if (res.statusCode === 201) {
            resolve();
          } else {
            console.error(`HTTP ${res.statusCode}`);
            process.exit(1);
          }
        });
      }
    );
    req.on("error", (e) => {
      console.error(`Request failed: ${e.message}`);
      process.exit(1);
    });
    req.write(body);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────
const text = await getTweetText();
if (text.length > 280) {
  console.error(`Tweet too long: ${text.length} chars (max 280)`);
  process.exit(1);
}
await postTweet(text);
