/**
 * Workflow state for daily-blog-publish cron job.
 * Each field flows between steps via set_state/get_state tools.
 * The agent sees `defaults` as initial state in step 0.
 */

export interface State {
  /** Directory for working draft HTML files */
  draft_dir: string;
  /** Directory for publish-ready HTML files */
  publish_dir: string;
  /** Full path to draft: draft_dir/<slug>-draft.html (set by step 05) */
  draft_path: string;
  /** Full path to publish-ready: publish_dir/<slug>.html (set by step 09) */
  publish_path: string;
  /** URL-friendly slug for the post (set by step 02) */
  topic_slug: string;
  /** Which topic pillar this post maps to */
  topic_pillar: string;
  /** Directory for content brief files */
  briefs_dir: string;
  /** Full path to content brief: briefs_dir/<slug>.md (set by step 05b) */
  content_brief_path: string;
  /** Eval score (1-100) from the publish gate */
  eval_score: number;
  /** SEO audit issues found */
  seo_issues: string[];
  /** AEO audit issues found */
  aeo_issues: string[];
  /** Style audit issues found */
  style_issues: string[];
  /** WordPress post ID after publishing */
  wp_post_id: number | null;
  /** Tweet ID after posting to X/Twitter */
  tweet_id: string | null;
}

export const defaults: Partial<State> = {
  draft_dir: "/Users/jie/Codes/warden/draft-html",
  publish_dir: "/Users/jie/Codes/warden/publish-html",
  briefs_dir: "/Users/jie/Codes/warden/cron-jobs/daily-blog-publish/briefs",
};
