"use client";

import { useTransition } from "react";

export function PublishModeToggle({
  jobId,
  mode,
  action,
}: {
  jobId: string;
  mode: string;
  action: (jobId: string, currentMode: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const isDraft = mode === "draft";

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => action(jobId, mode))}
      className={`rounded-full border px-2.5 py-0.5 font-mono text-xs transition-colors ${
        isDraft
          ? "border-phosphor/40 bg-phosphor/15 text-phosphor hover:bg-phosphor/25"
          : "border-border-subtle bg-onyx/50 text-text-tertiary hover:border-border-visible hover:text-text-secondary"
      } ${pending ? "opacity-50" : ""}`}
    >
      {isDraft ? "draft" : "auto"}
    </button>
  );
}

export function EnabledToggle({
  jobId,
  enabled,
  action,
}: {
  jobId: string;
  enabled: boolean;
  action: (jobId: string, currentEnabled: boolean) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => action(jobId, enabled))}
      className={`inline-block h-2.5 w-2.5 rounded-full transition-colors ${
        enabled ? "bg-emerald-500 hover:bg-emerald-400" : "bg-text-tertiary hover:bg-text-secondary"
      } ${pending ? "opacity-50" : ""}`}
      title={enabled ? "Click to disable" : "Click to enable"}
    />
  );
}

export function TriggerButton({
  jobId,
  action,
}: {
  jobId: string;
  action: (jobId: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => action(jobId))}
      className={`rounded border border-cyan-bright/30 bg-cyan-bright/10 px-2 py-0.5 font-mono text-xs text-cyan-bright transition-colors hover:bg-cyan-bright/20 ${pending ? "opacity-50" : ""}`}
      title="Run this job now"
    >
      {pending ? "..." : "run"}
    </button>
  );
}
