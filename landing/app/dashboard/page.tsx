import { createServerSupabase } from "../lib/supabase";
import type { Task, CronJob } from "../lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    running: "bg-blue-50 text-blue-600 border-blue-200",
    done: "bg-emerald-50 text-emerald-600 border-emerald-200",
    failed: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${colors[status] ?? "bg-surface text-text-tertiary border-border"}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-text-ghost">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-text-primary">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-text-tertiary">{sub}</p>
      )}
    </div>
  );
}

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

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return `${mins}m ${remSecs}s`;
}

export default async function DashboardOverview() {
  const sb = createServerSupabase();

  const [tasksRes, cronRes, runningRes] = await Promise.all([
    sb
      .from("warden_tasks")
      .select()
      .order("created_at", { ascending: false })
      .limit(10),
    sb
      .from("warden_cron_jobs")
      .select()
      .eq("enabled", true)
      .order("next_run_at", { ascending: true }),
    sb
      .from("warden_tasks")
      .select()
      .eq("status", "running")
      .limit(1)
      .maybeSingle(),
  ]);

  const recentTasks = (tasksRes.data ?? []) as Task[];
  const cronJobs = (cronRes.data ?? []) as CronJob[];
  const runningTask = runningRes.data as Task | null;

  // Stats
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = recentTasks.filter((t) => t.created_at.startsWith(today));
  const doneToday = todayTasks.filter((t) => t.status === "done").length;
  const failedToday = todayTasks.filter((t) => t.status === "failed").length;

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            System overview and recent activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${runningTask ? "bg-blue-500 glow-pulse" : "bg-green"}`}
          />
          <span className="text-xs text-text-tertiary">
            {runningTask ? "Processing task..." : "Idle"}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <StatCard
          label="Tasks today"
          value={todayTasks.length}
        />
        <StatCard
          label="Completed"
          value={doneToday}
          sub={todayTasks.length > 0 ? `${Math.round((doneToday / todayTasks.length) * 100)}% success` : "—"}
        />
        <StatCard
          label="Failed"
          value={failedToday}
        />
        <StatCard
          label="Cron jobs"
          value={cronJobs.length}
          sub="enabled"
        />
      </div>

      {/* Two columns: recent tasks + upcoming cron */}
      <div className="grid grid-cols-5 gap-10">
        {/* Recent tasks */}
        <div className="col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wide text-text-ghost">
              Recent Tasks
            </h2>
            <Link
              href="/dashboard/tasks"
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            {recentTasks.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-text-tertiary">
                No tasks yet
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-ghost">
                    <th className="px-4 py-3 font-medium">Instruction</th>
                    <th className="px-4 py-3 w-24 font-medium">Status</th>
                    <th className="px-4 py-3 w-20 font-medium">Duration</th>
                    <th className="px-4 py-3 w-20 text-right font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-border last:border-0 hover:bg-surface transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-text-secondary max-w-md truncate">
                        {task.instruction.slice(0, 80)}
                        {task.instruction.length > 80 ? "..." : ""}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-tertiary">
                        {duration(task.started_at, task.completed_at)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-text-ghost">
                        {timeAgo(task.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Upcoming cron jobs */}
        <div className="col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wide text-text-ghost">
              Upcoming Cron Jobs
            </h2>
            <Link
              href="/dashboard/cron"
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {cronJobs.length === 0 ? (
              <div className="rounded-xl border border-border px-5 py-8 text-center text-sm text-text-tertiary">
                No cron jobs enabled
              </div>
            ) : (
              cronJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-border px-4 py-3 hover:border-border-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary">
                      {job.name}
                    </p>
                    <span className="font-mono text-xs text-text-tertiary">
                      {job.cron_expression ?? "—"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-text-ghost">
                      {job.cron_timezone}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {job.next_run_at
                        ? `next: ${timeAgo(job.next_run_at)}`
                        : "not scheduled"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
