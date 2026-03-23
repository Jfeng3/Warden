import { createServerSupabase } from "../../lib/supabase";
import type { Task } from "../../lib/types";

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

interface CandidateTopic {
  title: string;
  slug: string;
  pillar: string;
  angle?: string;
}

function parseCandidateTopics(result: string | null): CandidateTopic[] {
  if (!result) return [];
  // Try to find JSON arrays in the result text
  const jsonMatch = result.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
  }
  // Try to parse structured text (bullet points with titles)
  const topics: CandidateTopic[] = [];
  const lines = result.split("\n");
  for (const line of lines) {
    const match = line.match(/(?:^[-•▸]\s*)?(?:\d+\.\s*)?(?:\*\*)?(.+?)(?:\*\*)?(?:\s*[-–—]\s*(.+))?$/);
    if (match && match[1] && match[1].length > 10 && match[1].length < 200) {
      topics.push({
        title: match[1].trim().replace(/\*\*/g, ""),
        slug: match[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        pillar: "unknown",
        angle: match[2]?.trim(),
      });
    }
  }
  return topics.slice(0, 8);
}

const PILLAR_COLORS: Record<string, string> = {
  "ai-discovery": "bg-blue-50 text-blue-600 border-blue-200",
  "agent-skills": "bg-purple-50 text-purple-600 border-purple-200",
  "agent-setup": "bg-amber-50 text-amber-600 border-amber-200",
  "hosting": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "unknown": "bg-surface text-text-tertiary border-border",
};

export default async function TopicsPage() {
  const sb = createServerSupabase();

  // Find recent pipeline tasks that contain topic selection results
  const { data } = await sb
    .from("warden_tasks")
    .select()
    .eq("status", "done")
    .or("instruction.ilike.%daily blog post%,instruction.ilike.%pick topic%,instruction.ilike.%candidate%")
    .order("created_at", { ascending: false })
    .limit(20);

  const tasks = (data ?? []) as Task[];

  // Group by date and extract topics
  const topicRuns = tasks
    .filter((t) => t.result && t.result.length > 50)
    .map((t) => ({
      task: t,
      topics: parseCandidateTopics(t.result),
      date: new Date(t.created_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    }))
    .filter((r) => r.topics.length > 0)
    .slice(0, 10);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          Topic Selection
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Candidate topics from recent pipeline runs — review and pick for the next post
        </p>
      </div>

      {/* Current pick-topic step config */}
      <div className="mb-8 rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-primary">
            Step 02 — Pick Topic
          </h2>
          <span className="font-mono text-xs text-text-ghost">02-pick-topic.md</span>
        </div>
        <p className="text-sm text-text-tertiary leading-relaxed">
          The pipeline shortlists <strong className="text-text-secondary">4 candidate topics</strong> (one per pillar),
          scored by relevance, timeliness, and content gap. The best one is auto-selected
          based on keyword research in Step 03. Override below by marking a preferred topic.
        </p>
      </div>

      {/* Topic runs */}
      {topicRuns.length === 0 ? (
        <div className="rounded-xl border border-border px-5 py-12 text-center">
          <p className="text-sm text-text-tertiary">
            No topic candidates found yet. Topics appear here after the daily pipeline runs
            the research stage.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {topicRuns.map((run) => (
            <div key={run.task.id}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-xs uppercase tracking-wide text-text-ghost">
                  {run.date}
                </h2>
                <span className="text-xs text-text-ghost">
                  {timeAgo(run.task.created_at)}
                </span>
                <span className="font-mono text-xs text-text-ghost">
                  {run.task.id.slice(0, 8)}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {run.topics.map((topic, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border p-4 hover:border-border-hover transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-medium text-text-primary leading-snug">
                        {topic.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                          PILLAR_COLORS[topic.pillar] || PILLAR_COLORS.unknown
                        }`}
                      >
                        {topic.pillar}
                      </span>
                    </div>
                    {topic.angle && (
                      <p className="text-xs text-text-tertiary leading-relaxed">
                        {topic.angle}
                      </p>
                    )}
                    {topic.slug && (
                      <p className="mt-2 font-mono text-[10px] text-text-ghost">
                        /{topic.slug}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
