import { createServerSupabase } from "../../lib/supabase";
import type { CronJob } from "../../lib/types";
import { PublishModeToggle, EnabledToggle } from "./toggle";
import { togglePublishMode, toggleEnabled } from "./actions";

export const dynamic = "force-dynamic";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatNextRun(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = d.getTime() - now;
  if (diff < 0) return "overdue";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `in ${days}d`;
}

export default async function CronPage() {
  const sb = createServerSupabase();
  const { data } = await sb
    .from("warden_cron_jobs")
    .select()
    .order("created_at", { ascending: true });

  const jobs = (data ?? []) as CronJob[];

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-3xl italic text-text-primary">
          Cron Jobs
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {jobs.length} scheduled jobs
        </p>
      </div>

      <div className="rounded-lg border border-border-subtle bg-onyx/30">
        {jobs.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-text-tertiary">
            No cron jobs configured
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle text-left font-mono text-xs uppercase tracking-wider text-text-tertiary">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 w-32">Schedule</th>
                <th className="px-4 py-3 w-28">Timezone</th>
                <th className="px-4 py-3 w-20 text-center">Enabled</th>
                <th className="px-4 py-3 w-20 text-center">Mode</th>
                <th className="px-4 py-3 w-20 text-center">Runs</th>
                <th className="px-4 py-3 w-24">Last Run</th>
                <th className="px-4 py-3 w-24 text-right">Next Run</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-border-subtle/50 last:border-0 hover:bg-onyx/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-primary">
                      {job.name}
                    </p>
                    <p className="mt-0.5 text-xs text-text-tertiary max-w-sm truncate">
                      {job.instruction.slice(0, 60)}
                      {job.instruction.length > 60 ? "..." : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-phosphor">
                    {job.cron_expression ?? job.schedule_type}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {job.cron_timezone}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <EnabledToggle
                      jobId={job.id}
                      enabled={job.enabled}
                      action={toggleEnabled}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PublishModeToggle
                      jobId={job.id}
                      mode={job.publish_mode}
                      action={togglePublishMode}
                    />
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-text-secondary">
                    {job.run_count}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-tertiary">
                    {job.last_run_at ? timeAgo(job.last_run_at) : "never"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-text-secondary">
                    {job.enabled
                      ? formatNextRun(job.next_run_at)
                      : "disabled"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-mono text-xs text-text-tertiary">Enabled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-text-tertiary" />
          <span className="font-mono text-xs text-text-tertiary">Disabled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-phosphor/40 bg-phosphor/15 px-2 py-0.5 font-mono text-xs text-phosphor">draft</span>
          <span className="font-mono text-xs text-text-tertiary">Review before publish</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-border-subtle bg-onyx/50 px-2 py-0.5 font-mono text-xs text-text-tertiary">auto</span>
          <span className="font-mono text-xs text-text-tertiary">Publish immediately</span>
        </div>
      </div>
    </>
  );
}
