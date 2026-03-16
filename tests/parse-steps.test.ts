import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSteps } from "../src/runner.js";

describe("parseSteps", () => {
  it("returns single step for instructions without STEP markers", () => {
    const instruction = "Do something simple";
    const { preamble, steps } = parseSteps(instruction);
    assert.equal(preamble, "");
    assert.equal(steps.length, 1);
    assert.equal(steps[0].index, 0);
    assert.equal(steps[0].text, instruction);
  });

  it("returns single step for instructions with only one STEP marker", () => {
    const instruction = "STEP 0: Do one thing\nSome details here";
    const { steps } = parseSteps(instruction);
    assert.equal(steps.length, 1);
    assert.equal(steps[0].index, 0);
    assert.equal(steps[0].text, instruction);
  });

  it("extracts preamble separately from steps", () => {
    const instruction = `You are a blog writer for openclaws.blog.

STEP 0: LOAD UTILITIES
Load skills/images for diagram rules.

STEP 1: RESEARCH
Search for news using You.com.`;

    const { preamble, steps } = parseSteps(instruction);
    assert.equal(preamble, "You are a blog writer for openclaws.blog.");
    assert.equal(steps.length, 2);

    assert.equal(steps[0].index, 0);
    assert.ok(steps[0].text.startsWith("STEP 0: LOAD UTILITIES"));
    assert.ok(!steps[0].text.includes("blog writer"));

    assert.equal(steps[1].index, 1);
    assert.ok(steps[1].text.startsWith("STEP 1: RESEARCH"));
  });

  it("returns empty preamble when no text before first step", () => {
    const instruction = `STEP 0: First
Do first.

STEP 1: Second
Do second.`;

    const { preamble, steps } = parseSteps(instruction);
    assert.equal(preamble, "");
    assert.equal(steps.length, 2);
    assert.ok(steps[0].text.startsWith("STEP 0: First"));
  });

  it("parses multiple steps in order", () => {
    const instruction = `Preamble text

STEP 0: LOAD UTILITIES
Load skills/images for diagram rules.

STEP 1: RESEARCH
Search for news using You.com.

STEP 2: PICK TOPIC
From all findings, pick the best one.`;

    const { preamble, steps } = parseSteps(instruction);
    assert.equal(preamble, "Preamble text");
    assert.equal(steps.length, 3);

    assert.equal(steps[0].index, 0);
    assert.ok(steps[0].text.includes("diagram rules"));

    assert.equal(steps[1].index, 1);
    assert.ok(steps[1].text.includes("You.com"));

    assert.equal(steps[2].index, 2);
    assert.ok(steps[2].text.includes("best one"));
  });

  it("handles non-sequential step numbers", () => {
    const instruction = `STEP 0: First
Do first thing.

STEP 5: Fifth
Do fifth thing.

STEP 10: Tenth
Do tenth thing.`;

    const { steps } = parseSteps(instruction);
    assert.equal(steps.length, 3);
    assert.equal(steps[0].index, 0);
    assert.equal(steps[1].index, 5);
    assert.equal(steps[2].index, 10);
  });

  it("trims whitespace from each step", () => {
    const instruction = `STEP 0: First

Some content with trailing whitespace.

STEP 1: Second
More content.
`;

    const { steps } = parseSteps(instruction);
    assert.equal(steps.length, 2);
    assert.ok(!steps[0].text.endsWith(" "));
    assert.ok(!steps[1].text.endsWith("\n"));
  });

  it("parses the daily-blog-publish instruction correctly", () => {
    const stepHeaders = Array.from({ length: 13 }, (_, i) =>
      `STEP ${i}: STEP_${i}_TITLE\nDo step ${i} things.\n`
    ).join("\n");

    const { steps } = parseSteps(stepHeaders);
    assert.equal(steps.length, 13);
    assert.equal(steps[0].index, 0);
    assert.equal(steps[12].index, 12);
  });
});
