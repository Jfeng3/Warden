/**
 * Resolves task metadata for cron jobs.
 * If explicit JSON string is provided (from --metadata flag), parses and returns it.
 * Otherwise falls back to WARDEN_TASK_METADATA env var (set by runner.ts during task execution).
 * Throws on invalid explicit JSON (caller should handle). Silently ignores malformed env var.
 */
export function resolveTaskMetadata(
  explicitJson: string | undefined
): Record<string, unknown> | undefined {
  if (explicitJson) {
    return JSON.parse(explicitJson);
  }

  const envJson = process.env.WARDEN_TASK_METADATA;
  if (envJson) {
    try {
      return JSON.parse(envJson);
    } catch {
      return undefined;
    }
  }

  return undefined;
}
