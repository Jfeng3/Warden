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
  // Basic markdown-to-HTML: headings, bold, lists, table-ish formatting
  return text
    .replace(/^### (.+)$/gm, '<h3 class="mt-4 mb-2 font-mono text-xs uppercase tracking-widest text-phosphor">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-5 mb-2 font-mono text-sm font-medium text-text-primary">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-text-tertiary">&#9744;</span><span>$1</span></div>')
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-phosphor">&#9656;</span><span>$1</span></div>')
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      return `<div class="grid grid-cols-${cells.length} gap-2 py-1 font-mono text-xs">${cells.map((c) => `<span>${c}</span>`).join("")}</div>`;
    })
    .replace(/\n{2,}/g, '<div class="h-3"></div>')
    .replace(/\n/g, "<br />");
}

export default async function ScansPage() {
  const sb = createServerSupabase();

  // Find tasks spawned by the daily-v2cloud-scan cron job
  // These tasks have instruction containing "co-marketing" or "V2Cloud"
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
        <h1 className="font-display text-3xl italic text-text-primary">
          Daily Scans
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Co-marketing partner scan results
        </p>
      </div>

      {scans.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-onyx/30 px-5 py-12 text-center text-sm text-text-tertiary">
          No scan results yet
        </div>
      ) : (
        <div className="space-y-4">
          {scans.map((scan) => (
            <details
              key={scan.id}
              className="group rounded-lg border border-border-subtle bg-onyx/30 transition-colors hover:border-border-visible"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 list-none">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-text-tertiary">
                    {scan.id.slice(0, 8)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {scan.instruction.slice(0, 80)}
                      {scan.instruction.length > 80 ? "..." : ""}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-text-tertiary">
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
                  className="text-text-tertiary transition-transform group-open:rotate-180"
                >
                  <polyline points="4,6 8,10 12,6" />
                </svg>
              </summary>
              <div className="border-t border-border-subtle px-5 py-4">
                {scan.result ? (
                  <div
                    className="text-sm text-text-secondary leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: renderScanResult(scan.result),
                    }}
                  />
                ) : (
                  <p className="text-sm text-text-tertiary italic">
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
