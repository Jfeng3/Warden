import { Type } from "@sinclair/typebox";
import type { ToolDefinition } from "@mariozechner/pi-coding-agent";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const WpParams = Type.Object({
  command: Type.String({
    description:
      'wp-cli command to execute (without the leading "wp"). Examples: "post list --post_status=publish", "post create --post_title=\\"My Post\\" --post_status=draft", "media import ./image.jpg --post_id=123 --featured_image"',
  }),
  content_file: Type.Optional(
    Type.String({
      description:
        'Path to a local HTML file whose content will be piped via stdin to the wp command. Use with "post create - --post_title=..." or "post update <id> -" where "-" reads from stdin. This is the correct way to publish long content.',
    })
  ),
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
  - post update <id> --post_title="New Title" --post_status=publish
  - post get <id> --field=post_content
  - post delete <id>
  - media import ./image.jpg --post_id=<id> --featured_image
  - post list --post_status=draft --fields=ID,post_title,post_date,post_status

For long content (blog posts), use content_file to pipe a local HTML file via stdin:
  - command: 'post create - --post_title="Title" --post_status=draft --porcelain', content_file: './draft.html'
  - command: 'post update <id> -', content_file: './updated.html'
The "-" in the command tells wp-cli to read content from stdin.

Post statuses: draft, publish, future (requires --post_date), pending, private.
Use --porcelain to return just the post ID.`,

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

    const fullCommand = `php -d error_reporting=E_ALL&~E_DEPRECATED $(which wp) ${params.command} --ssh="${wpSsh}"`;
    const timeout = params.timeout ?? 30000;

    try {
      let input: Buffer | undefined;
      if (params.content_file) {
        input = readFileSync(params.content_file);
      }

      const output = execSync(fullCommand, {
        timeout,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd(),
        input,
        stdio: ["pipe", "pipe", "pipe"], // separate stderr so PHP warnings don't pollute output
      });

      // Strip PHP deprecation/warning lines from wp-cli output
      const clean = output
        .split("\n")
        .filter((line) => !line.match(/^(PHP )?(Deprecated|Warning|Notice):/))
        .join("\n")
        .trim();

      return {
        content: [{ type: "text" as const, text: clean || "(no output)" }],
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
