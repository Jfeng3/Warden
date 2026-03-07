import { Type } from "@sinclair/typebox";
import type { ToolDefinition } from "@mariozechner/pi-coding-agent";
import fs from "node:fs";
import path from "node:path";

const SKILLS_DIR = path.join(process.cwd(), "skills");

interface SkillEntry {
  name: string;
  description: string;
  content: string;
}

/** Load all .md files from skills/ directory */
function loadSkills(): Map<string, SkillEntry> {
  const skills = new Map<string, SkillEntry>();
  if (!fs.existsSync(SKILLS_DIR)) return skills;

  for (const file of fs.readdirSync(SKILLS_DIR)) {
    if (!file.endsWith(".md")) continue;
    const name = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(SKILLS_DIR, file), "utf-8");

    // Extract description from first line if it starts with "# "
    const firstLine = raw.split("\n")[0] ?? "";
    const description = firstLine.startsWith("# ")
      ? firstLine.slice(2).trim()
      : name;

    skills.set(name, { name, description, content: raw });
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

    // Inject args into the skill content if provided
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
    .map((s) => `  - ${s.name}: ${s.description}`)
    .join("\n");

  return `Execute a skill by name. Skills are prompt templates that guide you through specific tasks.\n\nAvailable skills:\n${list || "  (none)"}`;
}
