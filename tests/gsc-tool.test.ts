import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";

// Import the tool after setting up env
let gscTool: any;

describe("gsc-tool", () => {
  before(async () => {
    const mod = await import("../src/gsc-tool.js");
    gscTool = mod.gscTool;
  });

  it("tool has correct name and description", () => {
    assert.equal(gscTool.name, "gsc");
    assert.equal(gscTool.label, "Google Search Console");
    assert.ok(gscTool.description.includes("topQueries"));
    assert.ok(gscTool.description.includes("topPages"));
    assert.ok(gscTool.description.includes("indexStatus"));
    assert.ok(gscTool.description.includes("sitemaps"));
  });

  it("returns error when no credentials are set", async () => {
    const savedInlineKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    try {
      const result = await gscTool.execute("test-call", { action: "topQueries" });
      assert.ok(result.content[0].text.includes("No GSC credentials found"));
    } finally {
      if (savedInlineKey) process.env.GOOGLE_SERVICE_ACCOUNT_KEY = savedInlineKey;
    }
  });

  it("returns error for unknown action", async () => {
    const result = await gscTool.execute("test-call", { action: "unknownAction" });
    assert.ok(result.content[0].text.includes("Unknown action"));
  });

  it("requires url parameter for indexStatus", async () => {
    const result = await gscTool.execute("test-call", { action: "indexStatus" });
    assert.ok(result.content[0].text.includes("url parameter is required"));
  });
});

// Live API tests — require GOOGLE_SERVICE_ACCOUNT_KEY in .env
const hasCredentials = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

describe("gsc-tool live API", { skip: !hasCredentials && "No GSC credentials configured" }, () => {
  before(async () => {
    const mod = await import("../src/gsc-tool.js");
    gscTool = mod.gscTool;
  });

  it("topQueries returns formatted table or empty message", { timeout: 15_000 }, async () => {
    const result = await gscTool.execute("test-call", { action: "topQueries", days: 7, limit: 5 });
    const text = result.content[0].text;
    // Either has data (TOP QUERIES header) or reports no data
    assert.ok(
      text.includes("TOP QUERIES") || text.includes("No query data found"),
      `Unexpected response: ${text.slice(0, 200)}`
    );
    // Should not be an API error
    assert.ok(!text.includes("GSC API error"), `Got API error: ${text.slice(0, 200)}`);
  });

  it("topPages returns formatted table or empty message", { timeout: 15_000 }, async () => {
    const result = await gscTool.execute("test-call", { action: "topPages", days: 7, limit: 5 });
    const text = result.content[0].text;
    assert.ok(
      text.includes("TOP PAGES") || text.includes("No page data found"),
      `Unexpected response: ${text.slice(0, 200)}`
    );
    assert.ok(!text.includes("GSC API error"), `Got API error: ${text.slice(0, 200)}`);
  });

  it("topQueries respects limit parameter", { timeout: 15_000 }, async () => {
    const result = await gscTool.execute("test-call", { action: "topQueries", days: 28, limit: 3 });
    const text = result.content[0].text;
    if (text.includes("TOP QUERIES")) {
      // Count data rows (lines starting with a number after the header)
      const dataLines = text.split("\n").filter((line: string) => /^\s*\d+\s+/.test(line));
      assert.ok(dataLines.length <= 3, `Expected at most 3 rows, got ${dataLines.length}`);
    }
  });

  it("sitemaps returns sitemap list", { timeout: 15_000 }, async () => {
    const result = await gscTool.execute("test-call", { action: "sitemaps" });
    const text = result.content[0].text;
    assert.ok(
      text.includes("SITEMAPS") || text.includes("No sitemaps submitted"),
      `Unexpected response: ${text.slice(0, 200)}`
    );
    assert.ok(!text.includes("GSC API error"), `Got API error: ${text.slice(0, 200)}`);
    // We know openclaws.blog has a sitemap
    if (text.includes("SITEMAPS")) {
      assert.ok(text.includes("openclaws.blog"), "Sitemap should reference openclaws.blog");
    }
  });

  it("indexStatus returns inspection data for a known URL", { timeout: 15_000 }, async () => {
    const result = await gscTool.execute("test-call", {
      action: "indexStatus",
      url: "https://openclaws.blog/2026/03/09/ai-agent-costs-at-scale/",
    });
    const text = result.content[0].text;
    assert.ok(
      text.includes("URL INSPECTION"),
      `Unexpected response: ${text.slice(0, 200)}`
    );
    assert.ok(text.includes("Coverage state:"), "Should include coverage state");
    assert.ok(text.includes("Indexing state:"), "Should include indexing state");
    assert.ok(!text.includes("GSC API error"), `Got API error: ${text.slice(0, 200)}`);
  });

  it("indexStatus handles non-existent URL gracefully", { timeout: 15_000 }, async () => {
    const result = await gscTool.execute("test-call", {
      action: "indexStatus",
      url: "https://openclaws.blog/this-page-does-not-exist-12345/",
    });
    const text = result.content[0].text;
    // Should still return inspection data (with "unknown" status), not crash
    assert.ok(
      text.includes("URL INSPECTION") || text.includes("No inspection data"),
      `Unexpected response: ${text.slice(0, 200)}`
    );
    assert.ok(!text.includes("GSC API error"), `Got API error: ${text.slice(0, 200)}`);
  });
});
