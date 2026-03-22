import { createServerSupabase } from "../../lib/supabase";
import type { Task } from "../../lib/types";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderScanResult(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="mt-4 mb-2 text-xs uppercase tracking-wide text-text-tertiary">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-5 mb-2 text-sm font-medium text-text-primary">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-text-ghost">&#9744;</span><span>$1</span></div>')
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-green">&#9656;</span><span>$1</span></div>')
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      return `<div class="grid grid-cols-${cells.length} gap-2 py-1 font-mono text-xs">${cells.map((c) => `<span>${c}</span>`).join("")}</div>`;
    })
    .replace(/\n{2,}/g, '<div class="h-3"></div>')
    .replace(/\n/g, "<br />");
}

export default async function ScansPage() {
  const sb = createServerSupabase();

  const { data } = await sb
    .from("warden_tasks")
    .select()
    .eq("status", "done")
    .or("instruction.ilike.%co-marketing%,instruction.ilike.%v2cloud%,instruction.ilike.%daily scan%")
    .order("created_at", { ascending: false })
    .limit(30);

  const scans = (data ?? []) as Task[];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          Daily Scans
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Co-marketing partner scan results
        </p>
      </div>

      {scans.length === 0 ? (
        <div className="rounded-xl border border-border px-5 py-12 text-center text-sm text-text-tertiary">
          No scan results yet
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => (
            <details
              key={scan.id}
              className="group rounded-xl border border-border transition-colors hover:border-border-hover"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 list-none">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-text-ghost">
                    {scan.id.slice(0, 8)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {scan.instruction.slice(0, 80)}
                      {scan.instruction.length > 80 ? "..." : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-text-ghost">
                      {formatDate(scan.created_at)}
                    </p>
                  </div>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-text-ghost transition-transform group-open:rotate-180"
                >
                  <polyline points="4,6 8,10 12,6" />
                </svg>
              </summary>
              <div className="border-t border-border px-5 py-4">
                {scan.result ? (
                  <div
                    className="text-sm text-text-tertiary leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: renderScanResult(scan.result),
                    }}
                  />
                ) : (
                  <p className="text-sm text-text-ghost italic">
                    No result content
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
