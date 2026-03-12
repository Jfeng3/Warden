"use client";

import { useEffect, useState, useRef } from "react";

/* ═══════════════════════════════════════════
   Terminal Simulation Component
   ═══════════════════════════════════════════ */

const TERMINAL_LINES = [
  { text: "$ warden start", type: "cmd" as const, delay: 0 },
  { text: "[08:00] Starting daily content research...", type: "info" as const, delay: 600 },
  { text: "[08:00] Analyzing industry trends and content gaps...", type: "dim" as const, delay: 1200 },
  { text: "[08:01] Found 3 high-value topic opportunities", type: "success" as const, delay: 2000 },
  { text: "[08:01] Scored and ranked by AEO potential", type: "success" as const, delay: 2600 },
  { text: "[08:01] Top pick: \"Why Your Automation Dies When You Close Your Laptop\"", type: "highlight" as const, delay: 3200 },
  { text: "[08:01] Audience fit: 5/5 | Content gap: 5/5 | AEO score: 5/5", type: "dim" as const, delay: 3800 },
  { text: "", type: "info" as const, delay: 4400 },
  { text: "[09:00] Starting scheduled draft...", type: "info" as const, delay: 4800 },
  { text: "[09:00] Loading brand voice + style guide...", type: "dim" as const, delay: 5400 },
  { text: "[09:01] Drafting post... (2,847 words)", type: "info" as const, delay: 6200 },
  { text: "[09:03] AEO audit: ✓ Q&A headings ✓ FAQ section ✓ quotable definitions", type: "cyan" as const, delay: 7000 },
  { text: "[09:03] SEO audit: ✓ meta description ✓ internal links ✓ keyword density", type: "cyan" as const, delay: 7600 },
  { text: "[09:04] Draft queued for team review", type: "cmd" as const, delay: 8200 },
  { text: "[09:04] ✓ Draft ready — awaiting editor approval", type: "success" as const, delay: 8800 },
  { text: "[09:04] ✓ Team notified via Slack", type: "success" as const, delay: 9400 },
];

function Terminal() {
  const [visibleLines, setVisibleLines] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    TERMINAL_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, line.delay)
      );
    });

    // Loop after completion
    const loopTimer = setTimeout(() => {
      setVisibleLines(0);
      // Restart
      TERMINAL_LINES.forEach((line, i) => {
        timers.push(
          setTimeout(() => {
            setVisibleLines(i + 1);
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }, line.delay)
        );
      });
    }, 13000);
    timers.push(loopTimer);

    return () => timers.forEach(clearTimeout);
  }, []);

  const colorMap = {
    cmd: "text-phosphor font-medium",
    info: "text-text-secondary",
    dim: "text-text-tertiary",
    success: "text-emerald-400",
    highlight: "text-phosphor font-medium",
    cyan: "text-cyan-bright",
  };

  return (
    <div className="rounded-xl border border-border-visible bg-obsidian/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-visible bg-onyx/60">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs font-mono text-text-tertiary tracking-wide">
          warden — content assistant
        </span>
      </div>
      {/* Terminal body */}
      <div
        ref={containerRef}
        className="p-5 font-mono text-sm leading-relaxed h-[340px] overflow-y-auto"
      >
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={`${colorMap[line.type]} ${line.text === "" ? "h-4" : ""}`}>
            {line.text}
          </div>
        ))}
        <span className="inline-block w-2.5 h-5 bg-phosphor cursor-blink ml-0.5 align-middle" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Waitlist Form (Hero CTA)
   ═══════════════════════════════════════════ */

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          You&apos;re on the list — we&apos;ll be in touch.
        </div>
        <a
          href="https://openclaws.blog"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 rounded-lg border border-border-visible text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors"
        >
          Read sample posts &rarr;
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-3 rounded-lg bg-onyx/80 border border-border-visible text-text-primary placeholder:text-text-tertiary font-mono text-sm focus:outline-none focus:border-phosphor/50 transition-colors w-64"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 rounded-lg bg-phosphor text-void font-medium hover:bg-phosphor-dim transition-colors disabled:opacity-60"
        >
          {status === "loading" ? "Joining..." : "Join the waitlist"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-400 text-sm font-mono">{errorMsg}</p>
      )}
      <a
        href="https://openclaws.blog"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 rounded-lg border border-border-visible text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors"
      >
        Read sample posts &rarr;
      </a>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Pipeline Step Component
   ═══════════════════════════════════════════ */

function PipelineStep({
  number,
  title,
  desc,
  schedule,
  icon,
}: {
  number: string;
  title: string;
  desc: string;
  schedule: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative flex gap-6 items-start">
      {/* Number orb */}
      <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-graphite border border-border-visible flex items-center justify-center group-hover:border-phosphor/40 group-hover:bg-onyx transition-all duration-500">
        <span className="text-phosphor font-mono text-lg font-medium">{number}</span>
      </div>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-text-tertiary">{icon}</span>
          <h3 className="font-display text-2xl text-text-primary italic">
            {title}
          </h3>
        </div>
        <p className="text-text-secondary leading-relaxed max-w-md">
          {desc}
        </p>
        <span className="inline-block mt-2 font-mono text-xs text-phosphor-dim tracking-wider uppercase">
          {schedule}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   AEO Feature Card
   ═══════════════════════════════════════════ */

function AeoCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative p-6 rounded-xl bg-onyx/60 border border-border-subtle hover:border-cyan-dim/30 transition-all duration-500 hover:bg-onyx/90">
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-glow to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="text-cyan-bright mb-4">{icon}</div>
        <h3 className="font-display text-xl italic text-text-primary mb-2">
          {title}
        </h3>
        <p className="text-text-secondary text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Stat Counter
   ═══════════════════════════════════════════ */

function Stat({
  value,
  label,
  suffix,
}: {
  value: string;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="text-center">
      <div className="font-mono text-4xl md:text-5xl font-light text-phosphor tracking-tight">
        {value}
        {suffix && (
          <span className="text-phosphor-dim text-2xl ml-1">{suffix}</span>
        )}
      </div>
      <div className="mt-2 text-text-tertiary text-sm tracking-wide uppercase font-mono">
        {label}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Uptime Indicator
   ═══════════════════════════════════════════ */

function UptimeDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 glow-pulse" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
    </span>
  );
}

/* ═══════════════════════════════════════════
   Navigation
   ═══════════════════════════════════════════ */

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-void/80 backdrop-blur-xl border-b border-border-subtle"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <span className="text-2xl">🦞</span>
          <span className="font-display text-xl italic text-text-primary">
            Warden
          </span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
          <a
            href="#pipeline"
            className="hover:text-phosphor transition-colors"
          >
            How It Works
          </a>
          <a href="#aeo" className="hover:text-phosphor transition-colors">
            Agent-Optimized
          </a>
          <a href="#pricing" className="hover:text-phosphor transition-colors">
            Compare
          </a>
          <a
            href="https://openclaws.blog"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-full border border-phosphor/30 text-phosphor hover:bg-phosphor/10 transition-all"
          >
            Read the blog &rarr;
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   SVG Icons (inline, no deps)
   ═══════════════════════════════════════════ */

const Icons = {
  radar: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  ),
  sparkle: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  ),
  pen: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  send: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  qa: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 9h6M9 13h4M9 17h5" />
    </svg>
  ),
  table: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  quote: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  ),
  list: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  shield: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  clock: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  globe: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <>
      <Nav />

      {/* ── HERO ── */}
      <section className="hero-gradient relative min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20">
          {/* Left — copy */}
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-2.5 mb-6">
              <UptimeDot />
              <span className="font-mono text-xs text-emerald-400 tracking-wider uppercase">
                Agent-optimized content pipeline
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-text-primary mb-6">
              More posts, zero new hires —{" "}
              <span className="italic text-phosphor">every one built for AI agents to read</span>
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed max-w-lg mb-8">
              An AI content assistant that finds high-value topics, writes
              publish-ready posts following your style guide, and structures
              every piece so ChatGPT, Perplexity, and Google AI Overviews
              can parse, quote, and cite your brand. Your team reviews and
              approves — the pipeline handles the rest.
            </p>

            <WaitlistForm />
          </div>

          {/* Right — terminal */}
          <div className="animate-fade-in-up delay-300">
            <Terminal />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-tertiary animate-fade-in-up delay-800">
          <span className="text-xs font-mono tracking-widest uppercase">
            Scroll
          </span>
          <svg
            width="16"
            height="24"
            viewBox="0 0 16 24"
            fill="none"
            className="animate-bounce"
          >
            <path
              d="M8 4v12m0 0l-4-4m4 4l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </section>

      {/* ── TAGLINE DIVIDER ── */}
      <section className="py-20 border-y border-border-subtle">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="font-display text-3xl md:text-4xl italic text-text-secondary leading-snug">
            Your editorial calendar has gaps.{" "}
            <span className="text-text-primary">AI answers are replacing Google clicks.</span>{" "}
            <span className="text-text-primary">We fill both.</span>
          </p>
          <p className="mt-4 text-text-tertiary text-sm font-mono tracking-wider uppercase">
            38% of searches now end in an AI answer. Unoptimized content gets cited 3% of the time.
          </p>
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section id="pipeline" className="py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="font-mono text-xs text-phosphor tracking-widest uppercase">
              How It Works
            </span>
            <h2 className="font-display text-4xl md:text-5xl italic text-text-primary mt-3 mb-4">
              Every post is engineered<br />
              for agent consumption
            </h2>
            <p className="text-text-secondary max-w-xl leading-relaxed">
              AI agents scan thousands of pages to build answers. They favor
              content with clear structure, extractable definitions, and
              machine-readable data. Our pipeline bakes these signals into
              every draft — so agents pick your content first.
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-0">
            {/* Steps */}
            <div className="flex flex-col gap-16">
              <PipelineStep
                number="01"
                title="Research"
                desc="Identifies topics that agents are actively answering questions about — then finds gaps where no authoritative source exists yet."
                schedule="Daily — 8:00 AM PT"
                icon={Icons.radar}
              />
              <PipelineStep
                number="02"
                title="Score"
                desc="Ranks each topic by agent-citation potential: How likely is an AI agent to need this answer? Is there a quotable source already?"
                schedule="Daily — 8:01 AM PT"
                icon={Icons.sparkle}
              />
              <PipelineStep
                number="03"
                title="Write"
                desc="Drafts 2,500–3,000 words with agent-parseable structure: Q&A headings, extractable definitions, comparison tables, and numbered procedures."
                schedule="Wed + Sun — 9:00 AM PT"
                icon={Icons.pen}
              />
              <PipelineStep
                number="04"
                title="Audit & Publish"
                desc="Runs agent-readability and SEO audits. Verifies every post has the six structural patterns agents use to decide what to cite."
                schedule="Wed + Sun — 9:04 AM PT"
                icon={Icons.send}
              />
            </div>

            {/* Connector line — desktop only */}
            <div className="hidden md:flex justify-center">
              <div className="pipeline-line w-px h-full" />
            </div>

            {/* Right side — what your team keeps vs what AI handles */}
            <div className="flex items-center">
              <div className="w-full p-8 rounded-2xl bg-onyx/50 border border-border-subtle">
                <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-6">
                  Your team + AI assistant
                </h3>
                <div className="space-y-5">
                  <div>
                    <div className="font-mono text-xs text-phosphor tracking-wider uppercase mb-3">
                      Your team handles
                    </div>
                    <ul className="space-y-2 text-sm text-text-secondary">
                      <li className="flex items-start gap-2"><span className="text-phosphor mt-0.5">&#9654;</span> Content strategy &amp; brand direction</li>
                      <li className="flex items-start gap-2"><span className="text-phosphor mt-0.5">&#9654;</span> Editorial review &amp; approval</li>
                      <li className="flex items-start gap-2"><span className="text-phosphor mt-0.5">&#9654;</span> Final tone and voice adjustments</li>
                    </ul>
                  </div>
                  <div className="border-t border-border-subtle pt-5">
                    <div className="font-mono text-xs text-cyan-bright tracking-wider uppercase mb-3">
                      AI assistant handles
                    </div>
                    <ul className="space-y-2 text-sm text-text-secondary">
                      <li className="flex items-start gap-2"><span className="text-cyan-bright mt-0.5">&#9654;</span> Agent-citation gap research</li>
                      <li className="flex items-start gap-2"><span className="text-cyan-bright mt-0.5">&#9654;</span> Agent-structured first drafts</li>
                      <li className="flex items-start gap-2"><span className="text-cyan-bright mt-0.5">&#9654;</span> Agent-readability &amp; SEO audits</li>
                      <li className="flex items-start gap-2"><span className="text-cyan-bright mt-0.5">&#9654;</span> Consistent publishing schedule</li>
                      <li className="flex items-start gap-2"><span className="text-cyan-bright mt-0.5">&#9654;</span> Extractable quote &amp; definition formatting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AEO ── */}
      <section id="aeo" className="py-28 relative grid-pattern">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="mb-16 max-w-2xl">
            <span className="font-mono text-xs text-cyan-bright tracking-widest uppercase">
              Agent-Readable Content
            </span>
            <h2 className="font-display text-4xl md:text-5xl italic text-text-primary mt-3 mb-4">
              Built for how agents{" "}
              <span className="text-cyan-bright">see your content</span>
            </h2>
            <p className="text-text-secondary leading-relaxed">
              AI agents don&apos;t read like humans. They scan for structure, extract
              definitions, parse tables, and rank by authority signals. Every post
              is engineered with these six patterns — the same ones ChatGPT,
              Perplexity, and Claude use to decide what to cite.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AeoCard
              title="Agent-Parseable Headings"
              description="Every H2 mirrors a question an agent would receive from a user. The first sentence is the direct answer — agents extract it verbatim."
              icon={Icons.qa}
            />
            <AeoCard
              title="Machine-Readable Tables"
              description="Structured comparison data agents can ingest and quote directly. When a user asks 'X vs Y,' agents pull your table as the definitive answer."
              icon={Icons.table}
            />
            <AeoCard
              title="Extractable Definitions"
              description="Crisp, self-contained statements agents can lift without rewriting. Each post has 3+ quotable blocks designed for direct agent extraction."
              icon={Icons.quote}
            />
            <AeoCard
              title="Numbered Procedures"
              description="Step-by-step sequences agents prefer when users ask 'how do I...' questions. Your brand becomes the agent's go-to instructional source."
              icon={Icons.list}
            />
            <AeoCard
              title="Authority Signals"
              description="First-person expertise, concrete data, and source citations. Agents rank content by credibility — these signals make agents trust your content first."
              icon={Icons.shield}
            />
            <AeoCard
              title="Freshness Markers"
              description="Current dates, recent stats, and timely references. Agents heavily deprioritize stale content — yours stays fresh and agent-preferred automatically."
              icon={Icons.clock}
            />
          </div>

          {/* AEO vs SEO comparison */}
          <div className="mt-16 p-8 rounded-2xl bg-obsidian/80 border border-border-subtle backdrop-blur-sm">
            <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-6">
              The Audience Shift You Can&apos;t Ignore
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-phosphor" />
                  <span className="font-mono text-sm text-phosphor">
                    Human-only content (yesterday)
                  </span>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Written for human readers and Google crawlers. Agents struggle
                  to extract clean answers — so they cite someone else.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-bright" />
                  <span className="font-mono text-sm text-cyan-bright">
                    Agent-optimized content (today)
                  </span>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Structured for both humans and AI agents. Agents parse, extract,
                  and cite your brand directly. One answer, your attribution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="pricing" className="py-28 border-y border-border-subtle">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="font-mono text-xs text-text-tertiary tracking-widest uppercase">
              The math
            </span>
            <h2 className="font-display text-4xl md:text-5xl italic text-text-primary mt-3">
              What 8+ posts a month actually costs
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 mb-16">
            {/* Do nothing */}
            <div className="p-6 rounded-2xl bg-onyx/50 border border-border-subtle text-center">
              <div className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-4">
                Do nothing
              </div>
              <div className="font-mono text-3xl text-text-primary mb-2">$0<span className="text-text-tertiary text-lg">/post</span></div>
              <ul className="text-sm text-text-secondary space-y-2 mt-6 text-left">
                <li>38% of searches end in AI answers</li>
                <li>3% citation rate for unoptimized content</li>
                <li>Traffic erodes quarter over quarter</li>
                <li>Competitors fill the gap</li>
              </ul>
            </div>
            {/* Freelancers */}
            <div className="p-6 rounded-2xl bg-onyx/50 border border-border-subtle text-center">
              <div className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-4">
                Freelance writers
              </div>
              <div className="font-mono text-3xl text-text-primary mb-2">$500<span className="text-text-tertiary text-lg">+/post</span></div>
              <ul className="text-sm text-text-secondary space-y-2 mt-6 text-left">
                <li>Timezone gaps, availability varies</li>
                <li>Voice drifts across writers</li>
                <li>You manage briefs &amp; feedback</li>
                <li>No AEO structure</li>
              </ul>
            </div>
            {/* Hire */}
            <div className="p-6 rounded-2xl bg-onyx/50 border border-border-subtle text-center">
              <div className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-4">
                Hire a content marketer
              </div>
              <div className="font-mono text-3xl text-text-primary mb-2">$100K<span className="text-text-tertiary text-lg">+/yr</span></div>
              <ul className="text-sm text-text-secondary space-y-2 mt-6 text-left">
                <li>3–6 month ramp-up</li>
                <li>PTO, benefits, management</li>
                <li>4–6 posts/month capacity</li>
                <li>No built-in AEO expertise</li>
              </ul>
            </div>
            {/* Agency */}
            <div className="p-6 rounded-2xl bg-onyx/50 border border-border-subtle text-center">
              <div className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-4">
                Outsource to agency
              </div>
              <div className="font-mono text-3xl text-text-primary mb-2">$2K<span className="text-text-tertiary text-lg">+/post</span></div>
              <ul className="text-sm text-text-secondary space-y-2 mt-6 text-left">
                <li>$16K+/month for 8 posts</li>
                <li>Brand voice drift over time</li>
                <li>Account manager overhead</li>
                <li>Rarely AEO-optimized</li>
              </ul>
            </div>
            {/* Warden */}
            <div className="p-6 rounded-2xl bg-onyx/50 border border-phosphor/30 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-phosphor text-void text-xs font-mono font-medium rounded-full">
                AI-assisted
              </div>
              <div className="font-mono text-xs text-phosphor tracking-widest uppercase mb-4">
                AI content assistant
              </div>
              <div className="font-mono text-3xl text-phosphor mb-2">~$200<span className="text-phosphor-dim text-lg">/post</span></div>
              <ul className="text-sm text-text-secondary space-y-2 mt-6 text-left">
                <li className="text-text-primary">8+ drafts/month, on schedule</li>
                <li className="text-text-primary">Built-in AEO + SEO audits</li>
                <li className="text-text-primary">Follows your style guide exactly</li>
                <li className="text-text-primary">Your team reviews &amp; approves</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <Stat value="8" label="Drafts / Month" suffix="+" />
            <Stat value="6" label="AEO Checks / Post" />
            <Stat value="~90" label="Hours Saved / Month" suffix="" />
            <Stat value="0" label="Missed Deadlines" />
          </div>
        </div>
      </section>

      {/* ── HOW AEO WORKS (example) ── */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="font-mono text-xs text-phosphor tracking-widest uppercase">
              In Practice
            </span>
            <h2 className="font-display text-4xl md:text-5xl italic text-text-primary mt-3">
              What agents see when they read your post
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* The post structure */}
            <div className="p-8 rounded-2xl bg-onyx/50 border border-border-subtle">
              <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-6">
                Agent-Optimized Post Structure
              </h3>
              <div className="font-mono text-sm space-y-3">
                {[
                  { level: 0, text: "H1: Benefit-driven title", color: "text-phosphor" },
                  { level: 1, text: "Opening hook (stat or problem)", color: "text-text-secondary" },
                  { level: 0, text: "H2: Key Takeaways", color: "text-cyan-bright" },
                  { level: 1, text: "3–5 bullet summary", color: "text-text-secondary" },
                  { level: 0, text: "H2: Why This Matters", color: "text-cyan-bright" },
                  { level: 0, text: "H2: The Problem", color: "text-cyan-bright" },
                  { level: 1, text: "H3 subsections for each pain point", color: "text-text-tertiary" },
                  { level: 0, text: "H2: The Solution", color: "text-cyan-bright" },
                  { level: 1, text: "Definition block (agent-extractable)", color: "text-emerald-400" },
                  { level: 0, text: "H2: Comparison Table", color: "text-cyan-bright" },
                  { level: 1, text: "3+ cols, 5+ rows (agent-parseable)", color: "text-emerald-400" },
                  { level: 0, text: "H2: Real-World Example", color: "text-cyan-bright" },
                  { level: 0, text: "H2: Getting Started", color: "text-cyan-bright" },
                  { level: 1, text: "Numbered steps (agent-preferred format)", color: "text-emerald-400" },
                  { level: 0, text: "H2: FAQ", color: "text-cyan-bright" },
                  { level: 1, text: "3–6 conversational Q&A pairs", color: "text-emerald-400" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`${item.color}`}
                    style={{ paddingLeft: `${item.level * 20}px` }}
                  >
                    {item.level > 0 ? "└ " : ""}
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* AI query simulation */}
            <div className="p-8 rounded-2xl bg-onyx/50 border border-border-subtle">
              <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-6">
                Agent Response — Your Content Cited
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="font-mono text-xs text-text-tertiary mb-2">
                    USER QUERY
                  </div>
                  <p className="text-text-primary italic">
                    &ldquo;What are the hidden costs of running AI agents 24/7?&rdquo;
                  </p>
                </div>
                <div>
                  <div className="font-mono text-xs text-text-tertiary mb-2">
                    AGENT RESPONSE (ChatGPT / Perplexity / Claude)
                  </div>
                  <p className="text-text-secondary leading-relaxed">
                    According to openclaws.blog, &ldquo;The Always-On Tax&rdquo; refers to the
                    hidden, recurring costs of keeping AI agents running
                    continuously — including token costs of $200K–$600K per agent
                    per year, infrastructure overhead, and the management burden
                    of maintaining always-active automation.
                  </p>
                </div>
                <div className="pt-4 border-t border-border-subtle">
                  <div className="font-mono text-xs text-cyan-bright mb-2">
                    YOUR BRAND CITED AS THE SOURCE
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-bright">openclaws.blog</span>
                    <span className="text-text-tertiary">—</span>
                    <span className="text-text-secondary text-sm">
                      Definition extracted verbatim, brand attributed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="py-28 border-t border-border-subtle">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="font-mono text-xs text-phosphor tracking-widest uppercase">
              Built For
            </span>
            <h2 className="font-display text-4xl md:text-5xl italic text-text-primary mt-3">
              You own the blog pipeline.<br />You need it to scale.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Demand gen directors",
                desc: "You own the blog and SEO pipeline. Your team of 1-2 writers plus a freelancer ships 3-4 posts a month — but you need 8+ to cover every vertical. You can't justify a $100K hire. You need overflow capacity that follows your style guide from day one.",
              },
              {
                name: "Teams juggling freelancers",
                desc: "Your contract writers are talented, but managing briefs, feedback loops, and timezone gaps eats your week. You need consistent output without the coordination tax — and AEO optimization your freelancers weren't trained on.",
              },
              {
                name: "Teams outgrowing agencies",
                desc: "You're spending $2K+ per post on agency overflow, frustrated by voice drift and slow turnarounds. Same output, a tenth of the cost, your style guide followed exactly.",
              },
              {
                name: "Early AEO adopters",
                desc: "You see traffic eroding as AI answers replace clicks. Optimized content gets cited 18% of the time vs 3% for unoptimized. Your competitors have massive content teams — you need a structural edge to get cited alongside them.",
              },
              {
                name: "Bootstrapped teams punching up",
                desc: "You're competing against companies with 10x your content budget. You can't outspend them — but you can out-structure them. AEO optimization is a leverage play that makes a 50-person company's content citeable alongside the enterprise giants.",
              },
              {
                name: "Content ops leaders",
                desc: "You need a full pipeline — research, draft, audit, review, publish — not a blank-page tool and a deadline. This runs on a schedule, not on willpower.",
              },
            ].map((persona) => (
              <div
                key={persona.name}
                className="p-6 rounded-xl border border-border-subtle bg-onyx/30 hover:bg-onyx/60 transition-colors duration-300"
              >
                <h3 className="font-display text-xl italic text-phosphor mb-3">
                  {persona.name}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {persona.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPEN SOURCE CTA ── */}
      <section className="py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-5xl mb-6 block">🦞</span>
          <h2 className="font-display text-4xl md:text-5xl italic text-text-primary mb-6">
            See it working in production
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            openclaws.blog is a live content property running the full pipeline.
            Every post is agent-optimized, published on schedule, and audited
            automatically. Browse the posts and see what 18% citation-rate
            content looks like in production.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://openclaws.blog"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-lg bg-phosphor text-void font-medium hover:bg-phosphor-dim transition-colors text-lg"
            >
              Browse live examples
            </a>
            <a
              href="https://github.com/qwibitai/warden"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-lg border border-border-visible text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors text-lg"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-lg">🦞</span>
            <span className="font-display text-lg italic text-text-secondary">
              Warden
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-tertiary">
            <a
              href="https://openclaws.blog"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary transition-colors"
            >
              Blog
            </a>
            <a
              href="https://github.com/qwibitai/warden"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/openclaw/openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary transition-colors"
            >
              OpenClaw
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-tertiary font-mono">
            <UptimeDot />
            <span>Content optimized for AI agents.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
