import { createServerSupabase } from "../../lib/supabase";
import type { Task, TaskStatus } from "../../lib/types";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: (TaskStatus | "all")[] = [
  "all",
  "pending",
  "running",
  "done",
  "failed",
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    running: "bg-cyan-bright/15 text-cyan-bright border-cyan-bright/30",
    done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs ${colors[status] ?? "bg-onyx text-text-tertiary border-border-subtle"}`}
    >
      {status}
    </span>
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

function shortId(id: string): string {
  return id.slice(0, 8);
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || "all";
  const page = parseInt(params.page || "1", 10);
  const pageSize = 20;

  const sb = createServerSupabase();
  let query = sb
    .from("warden_tasks")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, count } = await query;
  const tasks = (data ?? []) as Task[];
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl italic text-text-primary">
          Tasks
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {count ?? 0} total tasks
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <a
            key={s}
            href={`/dashboard/tasks${s === "all" ? "" : `?status=${s}`}`}
            className={`rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
              statusFilter === s
                ? "border-phosphor/40 bg-phosphor/10 text-phosphor"
                : "border-border-subtle bg-onyx/30 text-text-secondary hover:border-border-visible hover:text-text-primary"
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border-subtle bg-onyx/30">
        {tasks.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-text-tertiary">
            No tasks found
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle text-left font-mono text-xs uppercase tracking-wider text-text-tertiary">
                <th className="px-4 py-3 w-24">ID</th>
                <th className="px-4 py-3">Instruction</th>
                <th className="px-4 py-3 w-24">Status</th>
                <th className="px-4 py-3 w-20">Duration</th>
                <th className="px-4 py-3 w-24 text-right">Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="group border-b border-border-subtle/50 last:border-0 hover:bg-onyx/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-text-tertiary">
                    {shortId(task.id)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-primary max-w-lg truncate">
                      {task.instruction.slice(0, 100)}
                      {task.instruction.length > 100 ? "..." : ""}
                    </p>
                    {task.status === "failed" && task.error && (
                      <p className="mt-1 text-xs text-red-400 max-w-lg truncate">
                        {task.error.slice(0, 120)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {duration(task.started_at, task.completed_at)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-text-tertiary">
                    {timeAgo(task.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/dashboard/tasks?${statusFilter !== "all" ? `status=${statusFilter}&` : ""}page=${page - 1}`}
              className="rounded-md border border-border-subtle bg-onyx/30 px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-border-visible transition-colors"
            >
              &larr; Prev
            </a>
          )}
          <span className="font-mono text-xs text-text-tertiary">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/dashboard/tasks?${statusFilter !== "all" ? `status=${statusFilter}&` : ""}page=${page + 1}`}
              className="rounded-md border border-border-subtle bg-onyx/30 px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-border-visible transition-colors"
            >
              Next &rarr;
            </a>
          )}
        </div>
      )}
    </>
  );
}
