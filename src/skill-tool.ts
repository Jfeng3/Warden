import { Type } from "@sinclair/typebox";
import type { ToolDefinition } from "@mariozechner/pi-coding-agent";
import fs from "node:fs";
import path from "node:path";

const SKILLS_DIR = path.join(process.cwd(), "skills");

interface SkillEntry {
  name: string;
  description: string;
  trigger?: string;
  content: string;
}

/** Parse YAML frontmatter (trigger, description) from markdown content */
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      meta[key] = value;
    }
  }
  return { meta, body: match[2] };
}

/** Load all .md files from skills/ directory */
function loadSkills(): Map<string, SkillEntry> {
  const skills = new Map<string, SkillEntry>();
  if (!fs.existsSync(SKILLS_DIR)) return skills;

  for (const file of fs.readdirSync(SKILLS_DIR)) {
    if (!file.endsWith(".md")) continue;
    const name = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(SKILLS_DIR, file), "utf-8");
    const { meta, body } = parseFrontmatter(raw);

    // Description: frontmatter > first heading > filename
    const firstLine = body.split("\n")[0] ?? "";
    const description = meta.description
      || (firstLine.startsWith("# ") ? firstLine.slice(2).trim() : name);

    skills.set(name, {
      name,
      description,
      trigger: meta.trigger,
      content: body,
    });
  }
  return skills;
}

let cachedSkills: Map<string, SkillEntry> | null = null;

function getSkills(): Map<string, SkillEntry> {
  if (!cachedSkills) cachedSkills = loadSkills();
  return cachedSkills;
}

/** Force reload skills from disk (call after adding new skill files) */
export function reloadSkills(): void {
  cachedSkills = null;
}

/** List all available skill names */
export function listSkillNames(): string[] {
  return [...getSkills().keys()];
}

/** Get skill content by name (returns null if not found) */
export function getSkillContent(name: string): string | null {
  const entry = getSkills().get(name);
  return entry ? entry.content : null;
}

/** Return formatted skill summaries for inclusion in the system prompt */
export function listSkillSummaries(): string {
  const skills = getSkills();
  if (skills.size === 0) return "";

  const lines = [...skills.values()].map((s) => {
    const trigger = s.trigger ? ` | Trigger: ${s.trigger}` : "";
    return `  - ${s.name}: ${s.description}${trigger}`;
  });

  return `## Available Skills

Use the \`skill\` tool to load a skill's full prompt when needed. Do not guess — load the skill first.

${lines.join("\n")}`;
}

const SkillParams = Type.Object({
  skill: Type.String({ description: "Skill name (filename without .md extension)" }),
  args: Type.Optional(Type.String({ description: "Optional arguments to pass to the skill" })),
});

export const skillTool: ToolDefinition<typeof SkillParams> = {
  name: "skill",
  label: "Skill",
  description: buildDescription(),
  parameters: SkillParams,

  async execute(_toolCallId, params) {
    const skills = getSkills();
    const entry = skills.get(params.skill);

    if (!entry) {
      const available = [...skills.keys()];
      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown skill "${params.skill}". Available skills: ${available.length ? available.join(", ") : "(none — add .md files to skills/)"}`,
          },
        ],
        details: undefined,
      };
    }

    // Return full skill content (body without frontmatter)
    let content = entry.content;
    if (params.args) {
      content += `\n\n## User Arguments\n\n${params.args}`;
    }

    return {
      content: [{ type: "text" as const, text: content }],
      details: undefined,
    };
  },
};

function buildDescription(): string {
  const skills = loadSkills();
  const list = [...skills.values()]
    .map((s) => {
      const trigger = s.trigger ? ` (use when: ${s.trigger})` : "";
      return `  - ${s.name}: ${s.description}${trigger}`;
    })
    .join("\n");

  return `Execute a skill by name. Skills are prompt templates that guide you through specific tasks.\n\nAvailable skills:\n${list || "  (none)"}`;
}
