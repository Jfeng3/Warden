"use client";

import { useEffect, useState, useRef } from "react";

/* ═══════════════════════════════════════════
   Terminal
   ═══════════════════════════════════════════ */

const PIPELINE_COMMANDS = [
  { text: "warden start", type: "cmd" as const, delay: 0 },
  { text: "", type: "blank" as const, delay: 400 },
  { text: "▸ research  Scanning content gaps for AI-agent queries...", type: "step" as const, delay: 600 },
  { text: "  Found 3 topics with zero authoritative sources", type: "result" as const, delay: 1400 },
  { text: '  Top: "Why Your Automation Dies When You Close Your Laptop"', type: "highlight" as const, delay: 2200 },
  { text: "", type: "blank" as const, delay: 2800 },
  { text: "▸ score     AEO potential: 5/5 | Content gap: 5/5", type: "step" as const, delay: 3200 },
  { text: "  Audience fit: solo operators, agency-of-one founders", type: "result" as const, delay: 3800 },
  { text: "", type: "blank" as const, delay: 4200 },
  { text: "▸ draft     Loading brand voice + style guide...", type: "step" as const, delay: 4600 },
  { text: "  Drafting 2,847 words with 6 AEO structural patterns", type: "result" as const, delay: 5400 },
  { text: "", type: "blank" as const, delay: 5800 },
  { text: "▸ audit     ✓ Q&A headings  ✓ FAQ section  ✓ quotable defs", type: "check" as const, delay: 6200 },
  { text: "            ✓ comparison table  ✓ numbered steps  ✓ freshness", type: "check" as const, delay: 6800 },
  { text: "", type: "blank" as const, delay: 7200 },
  { text: "▸ publish   Draft queued for review", type: "step" as const, delay: 7600 },
  { text: "  ✓ Ready — awaiting editor approval", type: "success" as const, delay: 8200 },
];

function Terminal() {
  const [visibleLines, setVisibleLines] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    function runSequence() {
      setVisibleLines(0);
      PIPELINE_COMMANDS.forEach((line, i) => {
        timers.push(
          setTimeout(() => {
            setVisibleLines(i + 1);
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }, line.delay)
        );
      });
    }

    runSequence();
    const loop = setInterval(runSequence, 12000);
    timers.push(loop as unknown as NodeJS.Timeout);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, []);

  const colorMap: Record<string, string> = {
    cmd: "text-text-primary font-medium",
    blank: "",
    step: "text-text-tertiary",
    result: "text-text-ghost",
    highlight: "text-text-primary font-medium",
    check: "text-green",
    success: "text-green font-medium",
  };

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-elevated" />
          <div className="w-2.5 h-2.5 rounded-full bg-elevated" />
          <div className="w-2.5 h-2.5 rounded-full bg-elevated" />
        </div>
        <span className="ml-3 text-xs font-mono text-text-ghost tracking-wide">
          warden
        </span>
      </div>
      <div
        ref={containerRef}
        className="p-5 font-mono text-[13px] leading-relaxed h-[360px] overflow-y-auto bg-white"
      >
        {PIPELINE_COMMANDS.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`${colorMap[line.type]} ${line.type === "blank" ? "h-3" : ""}`}
          >
            {line.type === "cmd" ? `$ ${line.text}` : line.text}
          </div>
        ))}
        {visibleLines > 0 && (
          <span className="inline-block w-2 h-4 bg-text-primary cursor-blink mt-1" />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Waitlist Form
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
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 text-green text-sm">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          You&apos;re on the list.
        </div>
        <a
          href="https://openclaws.blog"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors"
        >
          Read sample posts
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-3 rounded-lg border border-border text-text-primary placeholder:text-text-ghost text-sm focus:outline-none focus:border-text-ghost transition-colors w-64"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 rounded-lg bg-text-primary text-white font-medium text-sm hover:bg-text-secondary transition-colors disabled:opacity-60"
        >
          {status === "loading" ? "..." : "Join waitlist"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-500 text-xs">{errorMsg}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Feature Card
   ═══════════════════════════════════════════ */

function FeatureCard({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border hover:border-border-hover transition-colors">
      <div className="text-xs text-text-ghost tracking-wide uppercase mb-3">
        {label}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-2 leading-snug">
        {title}
      </h3>
      <p className="text-text-tertiary text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Pipeline Step
   ═══════════════════════════════════════════ */

function PipelineStep({
  command,
  description,
  schedule,
  index,
}: {
  command: string;
  description: string;
  schedule: string;
  index: number;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-xs text-text-tertiary font-medium">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0 pb-8 border-b border-border last:border-0">
        <div className="font-mono text-sm text-text-primary mb-1">
          warden {command}
        </div>
        <p className="text-text-tertiary text-sm leading-relaxed mb-1">
          {description}
        </p>
        <span className="text-xs text-text-ghost">
          {schedule}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Stat
   ═══════════════════════════════════════════ */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary">
        {value}
      </div>
      <div className="mt-2 text-text-ghost text-xs tracking-wide uppercase">
        {label}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Status Dot
   ═══════════════════════════════════════════ */

function StatusDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-green opacity-75 glow-pulse" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="#" className="text-base font-semibold text-text-primary tracking-tight">
          warden
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm text-text-tertiary">
          <a href="#pipeline" className="hover:text-text-primary transition-colors">
            Pipeline
          </a>
          <a href="#aeo" className="hover:text-text-primary transition-colors">
            AEO
          </a>
          <a href="#compare" className="hover:text-text-primary transition-colors">
            Compare
          </a>
          <a href="#who" className="hover:text-text-primary transition-colors">
            Use Cases
          </a>
          <a
            href="https://openclaws.blog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            Live examples &rarr;
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <>
      <Nav />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-14">
        <div className="max-w-5xl mx-auto px-6 w-full grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center py-24">
          <div className="animate-fade-in">
            <div className="flex items-center gap-2.5 mb-8">
              <StatusDot />
              <span className="text-xs text-green tracking-wide">
                Content pipeline running
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight text-text-primary mb-6">
              More posts, zero new hires —{" "}
              <span className="text-text-tertiary">every one built for AI agents to read</span>
            </h1>

            <p className="text-base text-text-tertiary leading-relaxed max-w-lg mb-10">
              An AI content assistant that finds high-value topics, drafts posts
              following your style guide, and structures every piece so ChatGPT,
              Perplexity, and Google AI Overviews cite your brand. Your team
              reviews — the pipeline handles the rest.
            </p>

            <WaitlistForm />

            <div className="mt-8 flex items-center gap-6 text-text-ghost text-sm">
              <span>~$200/post</span>
              <span className="text-border">|</span>
              <span>8+ drafts/mo</span>
              <span className="text-border">|</span>
              <span>0 missed deadlines</span>
            </div>
          </div>

          <div className="animate-fade-in delay-200">
            <Terminal />
          </div>
        </div>
      </section>

      {/* ── PROOF BAR ── */}
      <div className="divider" />
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value="38%" label="Searches end in AI answers" />
            <Stat value="18%" label="Citation rate (AEO)" />
            <Stat value="3%" label="Citation rate (default)" />
            <Stat value="6x" label="More citations with AEO" />
          </div>
        </div>
      </section>
      <div className="divider" />

      {/* ── PIPELINE ── */}
      <section id="pipeline" className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-start">
            <div>
              <div className="text-xs text-text-ghost tracking-wide uppercase mb-3">
                How It Works
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-text-primary mb-5 leading-tight">
                Four commands. Full content pipeline.
              </h2>
              <p className="text-text-tertiary leading-relaxed mb-10">
                Every step runs on a schedule — research daily, drafts twice a
                week. Your team stays in control of strategy and approval.
              </p>

              <div className="p-5 rounded-xl border border-border">
                <div className="text-xs text-text-ghost tracking-wide uppercase mb-4">
                  Division of labor
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-xs text-text-secondary font-medium tracking-wide uppercase mb-2">
                      Your team
                    </div>
                    <ul className="space-y-1.5 text-text-tertiary">
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-text-tertiary" /> Content strategy & direction</li>
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-text-tertiary" /> Review & approve drafts</li>
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-text-tertiary" /> Final voice adjustments</li>
                    </ul>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="text-xs text-green font-medium tracking-wide uppercase mb-2">
                      AI assistant
                    </div>
                    <ul className="space-y-1.5 text-text-tertiary">
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green" /> Content gap research</li>
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green" /> Agent-structured first drafts</li>
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green" /> SEO + AEO audits</li>
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green" /> Scheduled publishing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <PipelineStep
                command="research"
                description="Identifies topics AI agents are actively answering questions about — then finds gaps where no authoritative source exists yet."
                schedule="Daily — 8:00 AM PT"
                index={0}
              />
              <PipelineStep
                command="score"
                description="Ranks each topic by agent-citation potential. How likely is an AI agent to need this answer? Is there a quotable source already?"
                schedule="Daily — 8:01 AM PT"
                index={1}
              />
              <PipelineStep
                command="draft"
                description="Writes 2,500-3,000 words with agent-parseable structure: Q&A headings, extractable definitions, comparison tables, numbered procedures."
                schedule="Wed + Sun — 9:00 AM PT"
                index={2}
              />
              <PipelineStep
                command="audit --publish"
                description="Runs agent-readability and SEO audits. Verifies all six structural patterns agents use to decide what to cite. Queues for review."
                schedule="Wed + Sun — 9:04 AM PT"
                index={3}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── AEO FEATURES ── */}
      <section id="aeo" className="py-28 bg-surface">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <div className="text-xs text-text-ghost tracking-wide uppercase mb-3">
              AEO — Agent Engine Optimization
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-text-primary mb-5 leading-tight">
              Six structural patterns agents use to decide what to cite
            </h2>
            <p className="text-text-tertiary leading-relaxed">
              AI agents don&apos;t read like humans. They scan for structure, extract
              definitions, parse tables, and rank by authority. Every post is
              engineered with these patterns.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              label="Pattern 01"
              title="Agent-Parseable Headings"
              description="Every H2 mirrors a question an agent would receive. The first sentence is the direct answer — agents extract it verbatim."
            />
            <FeatureCard
              label="Pattern 02"
              title="Machine-Readable Tables"
              description="Structured comparison data agents ingest and quote directly. When a user asks 'X vs Y,' agents pull your table as the answer."
            />
            <FeatureCard
              label="Pattern 03"
              title="Extractable Definitions"
              description="Crisp, self-contained statements agents can lift without rewriting. Each post has 3+ quotable blocks designed for extraction."
            />
            <FeatureCard
              label="Pattern 04"
              title="Numbered Procedures"
              description="Step-by-step sequences agents prefer for 'how do I...' queries. Your brand becomes the agent's go-to instructional source."
            />
            <FeatureCard
              label="Pattern 05"
              title="Authority Signals"
              description="First-person expertise, concrete data, source citations. Agents rank by credibility — these signals earn trust first."
            />
            <FeatureCard
              label="Pattern 06"
              title="Freshness Markers"
              description="Current dates, recent stats, timely references. Agents deprioritize stale content — yours stays fresh automatically."
            />
          </div>

          {/* Before / After */}
          <div className="mt-12 grid md:grid-cols-2 gap-4">
            <div className="p-6 rounded-xl border border-border bg-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-elevated" />
                <span className="text-xs text-text-ghost tracking-wide uppercase">
                  Without AEO
                </span>
              </div>
              <p className="text-text-tertiary text-sm leading-relaxed">
                Written for human readers and Google crawlers. Agents struggle
                to extract clean answers — they cite someone else. 3% citation rate.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-green/20 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green" />
                <span className="text-xs text-green tracking-wide uppercase">
                  With AEO
                </span>
              </div>
              <p className="text-text-tertiary text-sm leading-relaxed">
                Structured for both humans and AI agents. Agents parse, extract,
                and cite your brand directly. 18% citation rate — 6x improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARE ── */}
      <section id="compare" className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs text-text-ghost tracking-wide uppercase mb-3">
              The math
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">
              What 8+ posts a month actually costs
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3 mb-16">
            <CompareCard
              label="Do nothing"
              price="$0"
              unit="/post"
              items={[
                "38% of searches end in AI answers",
                "3% citation rate",
                "Traffic erodes quarterly",
                "Competitors fill the gap",
              ]}
            />
            <CompareCard
              label="Freelancers"
              price="$500"
              unit="+/post"
              items={[
                "Availability varies",
                "Voice drifts across writers",
                "You manage briefs & feedback",
                "No AEO structure",
              ]}
            />
            <CompareCard
              label="Hire"
              price="$100K"
              unit="+/yr"
              items={[
                "3-6 month ramp-up",
                "PTO, benefits, management",
                "4-6 posts/month capacity",
                "No built-in AEO expertise",
              ]}
            />
            <CompareCard
              label="Agency"
              price="$2K"
              unit="+/post"
              items={[
                "$16K+/month for 8 posts",
                "Brand voice drift",
                "Account manager overhead",
                "Rarely AEO-optimized",
              ]}
            />
            {/* Highlighted */}
            <div className="relative p-5 rounded-xl bg-surface border border-text-primary text-center">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-text-primary text-white text-[10px] font-semibold rounded-full tracking-wider uppercase">
                AI-assisted
              </div>
              <div className="text-xs text-text-ghost tracking-wide uppercase mb-3 mt-1">
                AI content assistant
              </div>
              <div className="text-2xl font-semibold text-text-primary mb-1">
                ~$200<span className="text-text-ghost text-sm">/post</span>
              </div>
              <ul className="text-sm text-text-secondary space-y-1.5 mt-4 text-left">
                <li className="flex items-start gap-1.5"><span className="text-green mt-0.5 text-xs">&#10003;</span> 8+ drafts/month, on schedule</li>
                <li className="flex items-start gap-1.5"><span className="text-green mt-0.5 text-xs">&#10003;</span> Built-in AEO + SEO audits</li>
                <li className="flex items-start gap-1.5"><span className="text-green mt-0.5 text-xs">&#10003;</span> Follows your style guide</li>
                <li className="flex items-start gap-1.5"><span className="text-green mt-0.5 text-xs">&#10003;</span> Your team reviews & approves</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value="8+" label="Drafts / month" />
            <Stat value="6" label="AEO checks / post" />
            <Stat value="~90h" label="Saved / month" />
            <Stat value="0" label="Missed deadlines" />
          </div>
        </div>
      </section>

      {/* ── HOW AEO WORKS ── */}
      <section className="py-28 bg-surface">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-14">
            <div className="text-xs text-text-ghost tracking-wide uppercase mb-3">
              In practice
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">
              What agents see when they read your post
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="p-6 rounded-xl border border-border bg-white">
              <div className="text-xs text-text-ghost tracking-wide uppercase mb-5">
                Agent-optimized structure
              </div>
              <div className="font-mono text-[13px] space-y-2">
                {[
                  { level: 0, text: "H1: Benefit-driven title", color: "text-text-primary" },
                  { level: 1, text: "Opening hook (stat or problem)", color: "text-text-ghost" },
                  { level: 0, text: "H2: Key Takeaways", color: "text-green" },
                  { level: 1, text: "3-5 bullet summary", color: "text-text-ghost" },
                  { level: 0, text: "H2: Why This Matters", color: "text-green" },
                  { level: 0, text: "H2: The Problem", color: "text-green" },
                  { level: 1, text: "H3 subsections per pain point", color: "text-text-ghost" },
                  { level: 0, text: "H2: The Solution", color: "text-green" },
                  { level: 1, text: "Definition block (extractable)", color: "text-text-tertiary" },
                  { level: 0, text: "H2: Comparison Table", color: "text-green" },
                  { level: 1, text: "3+ cols, 5+ rows (parseable)", color: "text-text-tertiary" },
                  { level: 0, text: "H2: Getting Started", color: "text-green" },
                  { level: 1, text: "Numbered steps (preferred format)", color: "text-text-tertiary" },
                  { level: 0, text: "H2: FAQ", color: "text-green" },
                  { level: 1, text: "3-6 conversational Q&A pairs", color: "text-text-tertiary" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={item.color}
                    style={{ paddingLeft: `${item.level * 16}px` }}
                  >
                    {item.level > 0 ? "└ " : ""}
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-white">
              <div className="text-xs text-text-ghost tracking-wide uppercase mb-5">
                Agent response — your content cited
              </div>
              <div className="space-y-5">
                <div>
                  <div className="text-xs text-text-ghost mb-1.5 uppercase">
                    User query
                  </div>
                  <p className="text-text-primary">
                    &ldquo;What are the hidden costs of running AI agents 24/7?&rdquo;
                  </p>
                </div>
                <div>
                  <div className="text-xs text-text-ghost mb-1.5 uppercase">
                    Agent response
                  </div>
                  <p className="text-text-tertiary leading-relaxed">
                    According to openclaws.blog, &ldquo;The Always-On Tax&rdquo; refers to the
                    hidden, recurring costs of keeping AI agents running
                    continuously — including token costs of $200K-$600K per agent
                    per year, infrastructure overhead, and the management burden
                    of maintaining always-active automation.
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="text-xs text-green mb-2 tracking-wide uppercase">
                    Your brand cited as the source
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-primary font-mono">openclaws.blog</span>
                    <span className="text-text-ghost">—</span>
                    <span className="text-text-ghost">
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
      <section id="who" className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-14">
            <div className="text-xs text-text-ghost tracking-wide uppercase mb-3">
              Use cases
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">
              Built for people who run on bandwidth, not headcount
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              label="Solo operators"
              title="Every hour writing is an hour not billing"
              description="You run the entire business alone — consulting, freelancing, micro-SaaS. You know content marketing works but can't maintain a cadence. Set it up once, monitor weekly."
            />
            <FeatureCard
              label="Small teams (2-5)"
              title="More topics than writers"
              description="Your 1-2 writers plus a freelancer ship 3-4 posts a month, but you need 8+ to cover every vertical. Overflow capacity that follows your style guide from day one."
            />
            <FeatureCard
              label="Bootstrapped companies"
              title="Out-structure, don't out-spend"
              description="Competing against companies with 10x your content budget. AEO optimization is a leverage play — makes your content citable alongside enterprise giants."
            />
            <FeatureCard
              label="Teams juggling freelancers"
              title="Consistent output without the coordination tax"
              description="Managing briefs, feedback loops, and timezone gaps eats your week. Same output, no back-and-forth, AEO optimization your freelancers weren't trained on."
            />
            <FeatureCard
              label="Early AEO adopters"
              title="AI answers are replacing clicks"
              description="Traffic is eroding as AI agents answer questions directly. Optimized content gets cited 18% of the time vs 3% for unoptimized. Structure is the new SEO."
            />
            <FeatureCard
              label="Content ops leaders"
              title="A pipeline, not a blank page"
              description="You need research → draft → audit → review → publish running on a schedule, not on willpower. This is a content system, not another writing tool."
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 bg-surface">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-text-primary mb-6 tracking-tight">
            See it live.
          </h2>
          <p className="text-text-tertiary text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Every post on openclaws.blog runs through this pipeline.
            Agent-optimized, published on schedule, audited automatically.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://openclaws.blog"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3 rounded-lg bg-text-primary text-white font-medium hover:bg-text-secondary transition-colors"
            >
              Browse live examples
            </a>
            <a
              href="https://github.com/qwibitai/warden"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3 rounded-lg border border-border text-text-tertiary hover:text-text-primary hover:border-border-hover transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-text-secondary tracking-tight">
            warden
          </span>
          <div className="flex items-center gap-6 text-sm text-text-ghost">
            <a href="https://openclaws.blog" target="_blank" rel="noopener noreferrer" className="hover:text-text-tertiary transition-colors">
              Blog
            </a>
            <a href="https://github.com/qwibitai/warden" target="_blank" rel="noopener noreferrer" className="hover:text-text-tertiary transition-colors">
              GitHub
            </a>
            <a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener noreferrer" className="hover:text-text-tertiary transition-colors">
              OpenClaw
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-ghost">
            <StatusDot />
            <span>Content optimized for AI agents</span>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ═══════════════════════════════════════════
   Compare Card
   ═══════════════════════════════════════════ */

function CompareCard({
  label,
  price,
  unit,
  items,
}: {
  label: string;
  price: string;
  unit: string;
  items: string[];
}) {
  return (
    <div className="p-5 rounded-xl border border-border text-center">
      <div className="text-xs text-text-ghost tracking-wide uppercase mb-3">
        {label}
      </div>
      <div className="text-2xl font-semibold text-text-primary mb-1">
        {price}<span className="text-text-ghost text-sm">{unit}</span>
      </div>
      <ul className="text-[13px] text-text-ghost space-y-1.5 mt-4 text-left">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
