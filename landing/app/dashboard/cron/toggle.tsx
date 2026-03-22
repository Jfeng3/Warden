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
      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
        isDraft
          ? "border-text-primary bg-text-primary/5 text-text-primary hover:bg-text-primary/10"
          : "border-border text-text-ghost hover:border-border-hover hover:text-text-tertiary"
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
        enabled ? "bg-green hover:bg-green-dim" : "bg-text-ghost hover:bg-text-tertiary"
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
      className={`rounded-lg border border-border px-2 py-0.5 text-xs text-text-tertiary transition-colors hover:border-border-hover hover:text-text-primary ${pending ? "opacity-50" : ""}`}
      title="Run this job now"
    >
      {pending ? "..." : "run"}
    </button>
  );
}
