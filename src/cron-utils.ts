import { CronExpressionParser } from "cron-parser";
import type { CronJob } from "./data_model/index.js";

/**
 * Compute the next run time for a cron job.
 * Returns ISO string or null if the job should not run again.
 */
export function computeNextRun(job: CronJob, from?: Date): string | null {
  const now = from ?? new Date();

  switch (job.schedule_type) {
    case "cron": {
      if (!job.cron_expression) return null;
      const interval = CronExpressionParser.parse(job.cron_expression, {
        currentDate: now,
        tz: job.cron_timezone || "UTC",
      });
      return interval.next().toISOString();
    }
    case "at": {
      // One-shot: if at_time is in the future, use it; otherwise null
      if (!job.at_time) return null;
      const atDate = new Date(job.at_time);
      return atDate > now ? atDate.toISOString() : null;
    }
    case "every": {
      if (!job.every_ms) return null;
      const base = job.last_run_at ? new Date(job.last_run_at) : now;
      return new Date(base.getTime() + job.every_ms).toISOString();
    }
    default:
      return null;
  }
}

const INTERVAL_UNITS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parse a human-friendly interval string like "30s", "5m", "2h", "1d" to milliseconds.
 */
export function parseInterval(str: string): number {
  const match = str.match(/^(\d+(?:\.\d+)?)\s*([smhd])$/i);
  if (!match) throw new Error(`Invalid interval "${str}". Use format like 30s, 5m, 2h, 1d`);
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  return Math.round(value * INTERVAL_UNITS[unit]);
}

/**
 * Validate a cron expression. Returns true if valid.
 */
export function validateCronExpression(expr: string): boolean {
  try {
    CronExpressionParser.parse(expr);
    return true;
  } catch {
    return false;
  }
}
