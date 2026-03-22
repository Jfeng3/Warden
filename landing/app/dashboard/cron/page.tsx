import { createServerSupabase } from "../../lib/supabase";
import type { CronJob } from "../../lib/types";
import { PublishModeToggle, EnabledToggle, TriggerButton } from "./toggle";
import { togglePublishMode, toggleEnabled, triggerNow } from "./actions";

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

  const jobs = ((data ?? []) as CronJob[]).sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          Cron Jobs
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          {jobs.length} scheduled jobs
        </p>
      </div>

      <div className="rounded-xl border border-border">
        {jobs.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-text-tertiary">
            No cron jobs configured
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-ghost">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 w-32 font-medium">Schedule</th>
                <th className="px-4 py-3 w-28 font-medium">Timezone</th>
                <th className="px-4 py-3 w-20 text-center font-medium">Enabled</th>
                <th className="px-4 py-3 w-20 text-center font-medium">Mode</th>
                <th className="px-4 py-3 w-20 text-center font-medium">Runs</th>
                <th className="px-4 py-3 w-24 font-medium">Last Run</th>
                <th className="px-4 py-3 w-24 text-right font-medium">Next Run</th>
                <th className="px-4 py-3 w-16 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-border last:border-0 hover:bg-surface transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-primary">
                      {job.name}
                    </p>
                    <p className="mt-0.5 text-xs text-text-ghost max-w-sm truncate">
                      {job.instruction.slice(0, 60)}
                      {job.instruction.length > 60 ? "..." : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {job.cron_expression ?? job.schedule_type}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-tertiary">
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
                  <td className="px-4 py-3 text-center font-mono text-xs text-text-tertiary">
                    {job.run_count}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-ghost">
                    {job.last_run_at ? timeAgo(job.last_run_at) : "never"}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-text-tertiary">
                    {job.enabled
                      ? formatNextRun(job.next_run_at)
                      : "disabled"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <TriggerButton jobId={job.id} action={triggerNow} />
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
          <span className="inline-block h-2 w-2 rounded-full bg-green" />
          <span className="text-xs text-text-ghost">Enabled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-text-ghost" />
          <span className="text-xs text-text-ghost">Disabled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-text-primary bg-text-primary/5 px-2 py-0.5 text-xs text-text-primary">draft</span>
          <span className="text-xs text-text-ghost">Review before publish</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-text-ghost">auto</span>
          <span className="text-xs text-text-ghost">Publish immediately</span>
        </div>
      </div>
    </>
  );
}
