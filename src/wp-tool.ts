import { Type } from "@sinclair/typebox";
import type { ToolDefinition } from "@mariozechner/pi-coding-agent";
import { execSync } from "node:child_process";

const WpParams = Type.Object({
  command: Type.String({
    description:
      'wp-cli command to execute (without the leading "wp"). Examples: "post list --post_status=publish", "post create --post_title=\\"My Post\\" --post_status=draft", "media import ./image.jpg --post_id=123 --featured_image"',
  }),
  timeout: Type.Optional(
    Type.Number({ description: "Timeout in milliseconds (default: 30000)" })
  ),
});

export const wpTool: ToolDefinition<typeof WpParams> = {
  name: "wp",
  label: "WordPress",
  parameters: WpParams,
  description: `Execute wp-cli commands against the WordPress site configured via WP_SSH.

Common commands:
  - post list --post_status=publish --fields=ID,post_title,post_date
  - post create --post_title="Title" --post_content="Body" --post_status=draft --porcelain
  - post create ./content.html --post_title="Title" --post_status=publish --porcelain
  - post update <id> --post_title="New Title" --post_status=publish
  - post get <id> --field=post_content
  - post delete <id>
  - media import ./image.jpg --post_id=<id> --featured_image
  - post list --post_status=draft --fields=ID,post_title,post_date,post_status

Post statuses: draft, publish, future (requires --post_date), pending, private.
Use --porcelain to return just the post ID. For long content, write HTML to a temp file first.`,

  async execute(_toolCallId, params) {
    const wpSsh = process.env.WP_SSH;
    if (!wpSsh) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: WP_SSH environment variable is not set. Set it to your WordPress SSH connection string (e.g. user@host).",
          },
        ],
        details: undefined,
      };
    }

    const fullCommand = `wp ${params.command} --ssh="${wpSsh}"`;
    const timeout = params.timeout ?? 30000;

    try {
      const output = execSync(fullCommand, {
        timeout,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd(),
      });

      return {
        content: [{ type: "text" as const, text: output || "(no output)" }],
        details: undefined,
      };
    } catch (err: any) {
      const stderr = err.stderr?.toString() ?? "";
      const stdout = err.stdout?.toString() ?? "";
      const message = stderr || stdout || err.message || "Unknown error";

      return {
        content: [
          {
            type: "text" as const,
            text: `wp command failed (exit ${err.status ?? "unknown"}):\n${message}`,
          },
        ],
        details: undefined,
      };
    }
  },
};
