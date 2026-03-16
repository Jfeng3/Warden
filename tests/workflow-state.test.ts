import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WorkflowState, createStateTools } from "../src/workflow-state.js";

describe("WorkflowState", () => {
  it("set and get basic values", () => {
    const state = new WorkflowState();
    state.set("topic", "AI agents for solopreneurs");
    state.set("score", 85);
    assert.equal(state.get("topic"), "AI agents for solopreneurs");
    assert.equal(state.get("score"), 85);
  });

  it("get returns undefined for missing keys", () => {
    const state = new WorkflowState();
    assert.equal(state.get("missing"), undefined);
  });

  it("getAll returns a copy, not a reference", () => {
    const state = new WorkflowState();
    state.set("a", 1);
    const snapshot = state.getAll();
    state.set("b", 2);
    assert.equal(snapshot.b, undefined);
  });

  it("toContext returns empty string when state is empty", () => {
    const state = new WorkflowState();
    assert.equal(state.toContext(), "");
  });

  it("toContext formats state as readable markdown", () => {
    const state = new WorkflowState();
    state.set("topic_slug", "ai-agents");
    state.set("eval_score", 82);
    state.set("issues", ["missing alt text", "no links"]);

    const ctx = state.toContext();
    assert.ok(ctx.includes("## Workflow State"));
    assert.ok(ctx.includes('- topic_slug: "ai-agents"'));
    assert.ok(ctx.includes("- eval_score: 82"));
    assert.ok(ctx.includes('- issues: ["missing alt text","no links"]'));
    assert.ok(ctx.includes("set_state"));
  });

  it("set overwrites existing keys", () => {
    const state = new WorkflowState();
    state.set("score", 50);
    state.set("score", 90);
    assert.equal(state.get("score"), 90);
  });
});

describe("createStateTools", () => {
  it("set_state tool stores values", async () => {
    const state = new WorkflowState();
    const [setTool] = createStateTools(state);
    const result = await setTool.execute("id", { key: "topic", value: "AI agents" }, undefined, undefined, {} as any);
    assert.ok(result.content[0].text.includes("topic"));
    assert.equal(state.get("topic"), "AI agents");
  });

  it("get_state tool retrieves specific key", async () => {
    const state = new WorkflowState();
    state.set("slug", "ai-solopreneurs");
    const [, getTool] = createStateTools(state);
    const result = await getTool.execute("id", { key: "slug" }, undefined, undefined, {} as any);
    assert.ok(result.content[0].text.includes("ai-solopreneurs"));
  });

  it("get_state tool returns all state when no key given", async () => {
    const state = new WorkflowState();
    state.set("a", 1);
    state.set("b", 2);
    const [, getTool] = createStateTools(state);
    const result = await getTool.execute("id", {}, undefined, undefined, {} as any);
    const parsed = JSON.parse(result.content[0].text);
    assert.equal(parsed.a, 1);
    assert.equal(parsed.b, 2);
  });

  it("get_state tool lists available keys for missing key", async () => {
    const state = new WorkflowState();
    state.set("topic", "test");
    const [, getTool] = createStateTools(state);
    const result = await getTool.execute("id", { key: "missing" }, undefined, undefined, {} as any);
    assert.ok(result.content[0].text.includes("not found"));
    assert.ok(result.content[0].text.includes("topic"));
  });

  it("tools share the same state instance", async () => {
    const state = new WorkflowState();
    const [setTool, getTool] = createStateTools(state);
    await setTool.execute("id", { key: "x", value: 42 }, undefined, undefined, {} as any);
    const result = await getTool.execute("id", { key: "x" }, undefined, undefined, {} as any);
    assert.ok(result.content[0].text.includes("42"));
  });
});
