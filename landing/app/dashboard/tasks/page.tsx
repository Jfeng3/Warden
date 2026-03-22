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
        <h1 className="text-2xl font-semibold text-text-primary">
          Tasks
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          {count ?? 0} total tasks
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <a
            key={s}
            href={`/dashboard/tasks${s === "all" ? "" : `?status=${s}`}`}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              statusFilter === s
                ? "border-text-primary bg-text-primary text-white"
                : "border-border text-text-tertiary hover:border-border-hover hover:text-text-primary"
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border">
        {tasks.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-text-tertiary">
            No tasks found
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-ghost">
                <th className="px-4 py-3 w-24 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Instruction</th>
                <th className="px-4 py-3 w-24 font-medium">Status</th>
                <th className="px-4 py-3 w-20 font-medium">Duration</th>
                <th className="px-4 py-3 w-24 text-right font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-border last:border-0 hover:bg-surface transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-text-ghost">
                    {shortId(task.id)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-secondary max-w-lg truncate">
                      {task.instruction.slice(0, 100)}
                      {task.instruction.length > 100 ? "..." : ""}
                    </p>
                    {task.status === "failed" && task.error && (
                      <p className="mt-1 text-xs text-red-500 max-w-lg truncate">
                        {task.error.slice(0, 120)}
                      </p>
                    )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/dashboard/tasks?${statusFilter !== "all" ? `status=${statusFilter}&` : ""}page=${page - 1}`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-tertiary hover:border-border-hover transition-colors"
            >
              &larr; Prev
            </a>
          )}
          <span className="text-xs text-text-ghost">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/dashboard/tasks?${statusFilter !== "all" ? `status=${statusFilter}&` : ""}page=${page + 1}`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-tertiary hover:border-border-hover transition-colors"
            >
              Next &rarr;
            </a>
          )}
        </div>
      )}
    </>
  );
}
