"use client";

import { useState, useTransition } from "react";

export function ResearchEditor({
  initialContent,
  saveAction,
}: {
  initialContent: string;
  saveAction: (content: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isDirty = content !== initialContent;

  function handleSave() {
    startTransition(async () => {
      setError("");
      setSaved(false);
      const result = await saveAction(content);
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error || "Failed to save");
      }
    });
  }

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-[480px] rounded-xl border border-border bg-white px-5 py-4 font-mono text-sm text-text-secondary leading-relaxed resize-none focus:outline-none focus:border-border-hover transition-colors"
        spellCheck={false}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending || !isDirty}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
            isDirty
              ? "bg-text-primary text-white hover:bg-text-secondary"
              : "bg-raised text-text-ghost cursor-not-allowed"
          } ${pending ? "opacity-50" : ""}`}
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
        {saved && (
          <span className="text-sm text-green">Saved</span>
        )}
        {error && (
          <span className="text-sm text-red-500">{error}</span>
        )}
        {isDirty && !saved && (
          <span className="text-xs text-text-ghost">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
