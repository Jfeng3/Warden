import { readFile } from "fs/promises";
import { ResearchEditor } from "./editor";
import { saveResearch } from "./actions";

export const dynamic = "force-dynamic";

const STEP_PATH = "/Users/jie/Codes/warden/cron-jobs/daily-blog-publish/steps/01-research.md";

export default async function ResearchPage() {
  let content = "";
  try {
    content = await readFile(STEP_PATH, "utf-8");
  } catch {
    content = "# Error\nCould not read research step file.";
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          Research Configuration
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Customize the research stage of the daily blog publish pipeline
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wide text-text-ghost">
              Step 01 — Research Instructions
            </h2>
            <span className="font-mono text-xs text-text-ghost">
              01-research.md
            </span>
          </div>
          <ResearchEditor initialContent={content} saveAction={saveResearch} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border p-5">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              How this works
            </h3>
            <div className="space-y-3 text-sm text-text-tertiary leading-relaxed">
              <p>
                This file is the instruction for <strong className="text-text-secondary">Step 1</strong> of
                the daily blog pipeline. When the cron job fires, Warden reads
                this file and executes the research stage accordingly.
              </p>
              <p>
                Changes take effect on the next pipeline run — no restart
                needed.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border p-5">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Pipeline steps
            </h3>
            <ol className="space-y-1.5 text-sm text-text-tertiary">
              {[
                { step: "01", label: "Research", active: true },
                { step: "02", label: "Pick topic" },
                { step: "03", label: "Keyword research" },
                { step: "04", label: "Notify topic" },
                { step: "05", label: "Evaluate topic" },
                { step: "06", label: "Draft" },
                { step: "07", label: "SEO audit" },
                { step: "08", label: "AEO audit" },
                { step: "09", label: "Style audit" },
                { step: "10", label: "Review & fix" },
                { step: "11", label: "Final eval" },
                { step: "12", label: "Publish" },
                { step: "13", label: "Tweet" },
                { step: "14", label: "Notify" },
              ].map((s) => (
                <li
                  key={s.step}
                  className={`flex items-center gap-2 ${s.active ? "text-text-primary font-medium" : ""}`}
                >
                  <span className={`font-mono text-xs w-5 ${s.active ? "text-green" : "text-text-ghost"}`}>
                    {s.step}
                  </span>
                  {s.label}
                  {s.active && (
                    <span className="ml-auto text-xs text-green">editing</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
