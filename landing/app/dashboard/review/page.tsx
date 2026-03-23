import { createServerSupabase } from "../../lib/supabase";
import type { Task } from "../../lib/types";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const PUBLISH_DIR = "/Users/jie/Codes/warden/publish-html";
const DRAFT_DIR = "/Users/jie/Codes/warden/draft-html";

interface PublishedPost {
  filename: string;
  slug: string;
  title: string;
  modifiedAt: Date;
  sizeKb: number;
  isDraft: boolean;
}

async function scanDir(dir: string, isDraft: boolean): Promise<PublishedPost[]> {
  try {
    const files = await readdir(dir);
    const htmlFiles = files.filter((f) => f.endsWith(".html"));
    const posts: PublishedPost[] = [];

    for (const file of htmlFiles) {
      const filePath = path.join(dir, file);
      const fileStat = await stat(filePath);
      const content = await readFile(filePath, "utf-8");

      // Extract title from <title> or <h1>
      const titleMatch = content.match(/<title>([^<]+)<\/title>/i)
        || content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const title = titleMatch?.[1]?.trim() || file.replace(/\.html$/, "").replace(/-/g, " ");

      posts.push({
        filename: file,
        slug: file.replace(/-draft\.html$/, "").replace(/\.html$/, ""),
        title,
        modifiedAt: fileStat.mtime,
        sizeKb: Math.round(fileStat.size / 1024),
        isDraft,
      });
    }

    return posts.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
  } catch {
    return [];
  }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function ReviewPage() {
  const sb = createServerSupabase();

  // Get recent publish tasks
  const { data: taskData } = await sb
    .from("warden_tasks")
    .select()
    .eq("status", "done")
    .ilike("instruction", "%daily blog post%")
    .order("created_at", { ascending: false })
    .limit(10);

  const recentTasks = (taskData ?? []) as Task[];

  // Scan local file system for published and draft posts
  const [publishedPosts, draftPosts] = await Promise.all([
    scanDir(PUBLISH_DIR, false),
    scanDir(DRAFT_DIR, true),
  ]);

  const allPosts = [...draftPosts, ...publishedPosts];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          Review & Approve
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Review pipeline outputs after Step 12 (Publish) — approve drafts or check published posts
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-text-ghost">Drafts pending</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{draftPosts.length}</p>
          <p className="mt-0.5 text-xs text-text-tertiary">in draft-html/</p>
        </div>
        <div className="rounded-xl border border-border px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-text-ghost">Published</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{publishedPosts.length}</p>
          <p className="mt-0.5 text-xs text-text-tertiary">in publish-html/</p>
        </div>
        <div className="rounded-xl border border-border px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-text-ghost">Recent pipeline runs</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{recentTasks.length}</p>
          <p className="mt-0.5 text-xs text-text-tertiary">completed blog tasks</p>
        </div>
      </div>

      {/* Drafts needing review */}
      {draftPosts.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs uppercase tracking-wide text-text-ghost">
            Drafts — Awaiting Review
          </h2>
          <div className="space-y-2">
            {draftPosts.map((post) => (
              <div
                key={post.filename}
                className="rounded-xl border border-amber-200 bg-amber-50/50 px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {post.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="font-mono text-xs text-text-ghost">
                        /{post.slug}
                      </span>
                      <span className="text-xs text-text-ghost">
                        {post.sizeKb} KB
                      </span>
                      <span className="text-xs text-text-ghost">
                        {timeAgo(post.modifiedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs text-amber-700">
                      draft
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published posts */}
      <div>
        <h2 className="mb-3 text-xs uppercase tracking-wide text-text-ghost">
          Published Posts
        </h2>
        {publishedPosts.length === 0 ? (
          <div className="rounded-xl border border-border px-5 py-12 text-center text-sm text-text-tertiary">
            No published posts yet
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-ghost">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 w-40 font-medium">Slug</th>
                  <th className="px-4 py-3 w-20 font-medium">Size</th>
                  <th className="px-4 py-3 w-28 text-right font-medium">Modified</th>
                </tr>
              </thead>
              <tbody>
                {publishedPosts.map((post) => (
                  <tr
                    key={post.filename}
                    className="border-b border-border last:border-0 hover:bg-surface transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text-secondary truncate max-w-md">
                      {post.title}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-ghost">
                      /{post.slug}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-ghost">
                      {post.sizeKb} KB
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-text-ghost">
                      {timeAgo(post.modifiedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent pipeline runs */}
      {recentTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xs uppercase tracking-wide text-text-ghost">
            Recent Pipeline Runs
          </h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-ghost">
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 w-24 font-medium">Status</th>
                  <th className="px-4 py-3 w-28 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-border last:border-0 hover:bg-surface transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text-secondary truncate max-w-lg">
                      {task.result
                        ? task.result.slice(0, 100) + (task.result.length > 100 ? "..." : "")
                        : task.instruction.slice(0, 80)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-emerald-50 text-emerald-600 border-emerald-200">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-text-ghost">
                      {new Date(task.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
