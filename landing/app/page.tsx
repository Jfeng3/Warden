"use client";

import { useEffect, useState, useRef } from "react";

/* ═══════════════════════════════════════════
   Terminal Simulation Component
   ═══════════════════════════════════════════ */

const TERMINAL_LINES = [
  { text: "$ warden start --provider anthropic", type: "cmd" as const, delay: 0 },
  { text: "[08:00] Polling task queue...", type: "info" as const, delay: 600 },
  { text: "[08:00] Cron triggered: daily-v2cloud-scan", type: "info" as const, delay: 1200 },
  { text: "[08:00] Running competitive content analysis...", type: "dim" as const, delay: 1800 },
  { text: "[08:01] Found 2 new posts, 1 refresh", type: "success" as const, delay: 2600 },
  { text: "[08:01] Generated 3 complementary topic ideas", type: "success" as const, delay: 3200 },
  { text: "[08:01] Top pick: \"Why Your Automation Dies When You Close Your Laptop\"", type: "highlight" as const, delay: 3800 },
  { text: "[08:01] Score: cross-link=5, audience=4, gap=5, fit=5", type: "dim" as const, delay: 4200 },
  { text: "", type: "info" as const, delay: 4800 },
  { text: "[09:00] Cron triggered: biweekly-blog-publish", type: "info" as const, delay: 5000 },
  { text: "[09:00] Loading skills: content-style, seo-audit, aeo-audit", type: "dim" as const, delay: 5600 },
  { text: "[09:01] Writing post... (2,847 words)", type: "info" as const, delay: 6400 },
  { text: "[09:03] AEO check: ✓ Q&A headings ✓ FAQ section ✓ definition blocks", type: "cyan" as const, delay: 7200 },
  { text: "[09:03] SEO check: ✓ meta tags ✓ internal links ✓ keyword density 1.4%", type: "cyan" as const, delay: 7800 },
  { text: "[09:04] Publishing to WordPress...", type: "cmd" as const, delay: 8400 },
  { text: "[09:04] ✓ Published: post ID 247", type: "success" as const, delay: 9200 },
  { text: "[09:04] ✓ Notified Telegram: task complete", type: "success" as const, delay: 9800 },
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
          warden — mac-mini — zsh
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
            OpenClaws
          </span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
          <a
            href="#pipeline"
            className="hover:text-phosphor transition-colors"
          >
            Pipeline
          </a>
          <a href="#aeo" className="hover:text-phosphor transition-colors">
            AEO
          </a>
          <a href="#stats" className="hover:text-phosphor transition-colors">
            Stats
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
                Agent online — Mac Mini
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-text-primary mb-6">
              Your AI{" "}
              <span className="italic text-phosphor">content marketer</span>
              {" "}that writes for{" "}
              <span className="italic text-cyan-bright">AI to cite</span>
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed max-w-lg mb-8">
              An always-on AI content assistant that researches trends, drafts
              AEO-optimized posts, and publishes on schedule. Every article is
              structured so ChatGPT, Perplexity, and Google AI Overviews
              extract and cite your brand as the answer.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#aeo"
                className="px-6 py-3 rounded-lg bg-phosphor text-void font-medium hover:bg-phosphor-dim transition-colors"
              >
                See how AEO works
              </a>
              <a
                href="https://openclaws.blog"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg border border-border-visible text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors"
              >
                Read sample posts &rarr;
              </a>
            </div>
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
            Your content should show up when{" "}
            <span className="text-text-primary">AI answers questions</span> about{" "}
            <span className="text-text-primary">your industry</span>
          </p>
          <p className="mt-4 text-text-tertiary text-sm font-mono tracking-wider uppercase">
            That&apos;s what AEO-optimized content does
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
              A content marketer<br />
              that never clocks out
            </h2>
            <p className="text-text-secondary max-w-xl leading-relaxed">
              Your AI content assistant monitors industry trends, identifies
              high-value topics, drafts publication-ready posts, and publishes on
              a schedule your team controls. Review and approve, or let it run
              hands-free.
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-0">
            {/* Steps */}
            <div className="flex flex-col gap-16">
              <PipelineStep
                number="01"
                title="Monitor"
                desc="Tracks competitor and partner content daily. Spots trending topics, identifies content gaps, and surfaces opportunities your team would miss."
                schedule="Daily — 8:00 AM PT"
                icon={Icons.radar}
              />
              <PipelineStep
                number="02"
                title="Generate"
                desc="Scores topic ideas on keyword overlap, audience fit, and co-marketing potential. Prioritizes what will drive traffic and citations."
                schedule="Daily — 8:01 AM PT"
                icon={Icons.sparkle}
              />
              <PipelineStep
                number="03"
                title="Write"
                desc="Drafts a full 2,500–3,000 word post following your brand voice, with AEO-structured headings, comparison tables, FAQ sections, and quotable definitions."
                schedule="Wed + Sun — 9:00 AM PT"
                icon={Icons.pen}
              />
              <PipelineStep
                number="04"
                title="Publish"
                desc="Runs SEO and AEO audits automatically. Publishes to WordPress and notifies your team. Ready for review or live immediately."
                schedule="Wed + Sun — 9:04 AM PT"
                icon={Icons.send}
              />
            </div>

            {/* Connector line — desktop only */}
            <div className="hidden md:flex justify-center">
              <div className="pipeline-line w-px h-full" />
            </div>

            {/* Right side — architecture card */}
            <div className="flex items-center">
              <div className="w-full p-8 rounded-2xl bg-onyx/50 border border-border-subtle">
                <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-6">
                  Architecture
                </h3>
                <div className="space-y-4 font-mono text-sm">
                  {[
                    { label: "Agent", value: "Warden CLI (TypeScript)" },
                    { label: "Runtime", value: "Mac Mini — always on" },
                    { label: "Queue", value: "Supabase (Postgres)" },
                    { label: "LLM", value: "Claude via Anthropic API" },
                    { label: "Publisher", value: "wp-cli over SSH" },
                    { label: "CMS", value: "WordPress" },
                    { label: "Notify", value: "Telegram Bot" },
                    { label: "Languages", value: "English + 中文" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0"
                    >
                      <span className="text-text-tertiary">{row.label}</span>
                      <span className="text-text-primary">{row.value}</span>
                    </div>
                  ))}
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
              Answer Engine Optimization
            </span>
            <h2 className="font-display text-4xl md:text-5xl italic text-text-primary mt-3 mb-4">
              When prospects ask AI,<br />
              your brand is{" "}
              <span className="text-cyan-bright">the answer</span>
            </h2>
            <p className="text-text-secondary leading-relaxed">
              57% of business buyers now start research with AI tools, not Google.
              AEO ensures your content is what ChatGPT, Perplexity, and Google AI
              Overviews cite when prospects ask questions about your industry.
              Every post passes a rigorous AEO audit before publishing.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AeoCard
              title="Q&A Heading Structure"
              description="Every heading mirrors how prospects ask AI questions. The first sentence directly answers it — so AI models pull your content, not a competitor's."
              icon={Icons.qa}
            />
            <AeoCard
              title="Comparison Tables"
              description="Structured data AI can parse and quote in side-by-side comparisons. When someone asks 'X vs Y,' your table becomes the answer."
              icon={Icons.table}
            />
            <AeoCard
              title="Quotable Definitions"
              description="Crisp, citeable statements AI models extract verbatim. Each post has 3+ brand-attributed quotes ready for AI to surface."
              icon={Icons.quote}
            />
            <AeoCard
              title="Numbered Steps"
              description="Actionable how-to sections that AI models prefer for procedural answers. Your brand becomes the go-to instructional source."
              icon={Icons.list}
            />
            <AeoCard
              title="Authority Signals"
              description="First-person expertise, specific data points, and source citations. AI models rank sources by credibility — these signals put you first."
              icon={Icons.shield}
            />
            <AeoCard
              title="Recency Markers"
              description="Current dates, fresh statistics, and up-to-date references. AI models strongly deprioritize stale content — yours stays fresh automatically."
              icon={Icons.clock}
            />
          </div>

          {/* AEO vs SEO comparison */}
          <div className="mt-16 p-8 rounded-2xl bg-obsidian/80 border border-border-subtle backdrop-blur-sm">
            <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-6">
              The Shift Content Teams Can&apos;t Ignore
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-phosphor" />
                  <span className="font-mono text-sm text-phosphor">
                    SEO alone (yesterday)
                  </span>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Compete for page-one rankings. Prospects click through 10 blue
                  links. Your content fights for attention alongside every
                  competitor.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-bright" />
                  <span className="font-mono text-sm text-cyan-bright">
                    SEO + AEO (today)
                  </span>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  AI gives prospects one answer — and credits the source.
                  AEO-optimized content makes your brand that source. No click
                  competition. Direct attribution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="py-28 border-y border-border-subtle">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="font-mono text-xs text-text-tertiary tracking-widest uppercase">
              By the Numbers
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <Stat value="24/7" label="Content Monitoring" />
            <Stat value="8" label="Posts / Month" suffix="+" />
            <Stat value="6" label="AEO Checks / Post" />
            <Stat value="0" label="Writer Burnout" />
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
              How your content gets cited
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* The post structure */}
            <div className="p-8 rounded-2xl bg-onyx/50 border border-border-subtle">
              <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-6">
                Post Structure — AEO Template
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
                  { level: 1, text: "Definition block (extractable)", color: "text-emerald-400" },
                  { level: 0, text: "H2: Comparison Table", color: "text-cyan-bright" },
                  { level: 1, text: "3+ cols, 5+ rows (machine-readable)", color: "text-emerald-400" },
                  { level: 0, text: "H2: Real-World Example", color: "text-cyan-bright" },
                  { level: 0, text: "H2: Getting Started", color: "text-cyan-bright" },
                  { level: 1, text: "Numbered steps (AI-preferred)", color: "text-emerald-400" },
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
                AI Query Result — Simulated
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="font-mono text-xs text-text-tertiary mb-2">
                    USER QUERY
                  </div>
                  <p className="text-text-primary italic">
                    &ldquo;What are the hidden costs of always-on cloud infrastructure?&rdquo;
                  </p>
                </div>
                <div>
                  <div className="font-mono text-xs text-text-tertiary mb-2">
                    AI ANSWER (ChatGPT / Perplexity)
                  </div>
                  <p className="text-text-secondary leading-relaxed">
                    According to openclaws.blog, &ldquo;The Always-On Tax&rdquo; refers to the
                    hidden, recurring costs of keeping cloud-based automation
                    running continuously — including compute bills, monitoring
                    overhead, and the cognitive load of managing always-active
                    infrastructure.
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

      {/* ── BRANDED CONCEPTS ── */}
      <section className="py-28 border-t border-border-subtle">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="font-mono text-xs text-phosphor tracking-widest uppercase">
              Brand Vocabulary
            </span>
            <h2 className="font-display text-4xl md:text-5xl italic text-text-primary mt-3">
              Own the language AI uses
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "The Always-On Tax",
                desc: "The hidden cost of cloud subscriptions that never sleep — compute bills, monitoring overhead, and the mental load of always-active infrastructure.",
              },
              {
                name: "The Laptop Trap",
                desc: "When your automation only runs while your laptop is open. Close the lid, and everything stops. The fragility of developer-machine workflows.",
              },
              {
                name: "The Infrastructure Gap",
                desc: "The space between 'it works on my machine' and 'it runs reliably for the business.' Where most automation projects die.",
              },
              {
                name: "The Deployment Desert",
                desc: "The barren stretch between building a working prototype and deploying it somewhere it runs unsupervised. Most never cross it.",
              },
              {
                name: "The Separation Principle",
                desc: "Keep your AI workloads on dedicated hardware, separate from your daily driver. Reliability through isolation.",
              },
            ].map((concept) => (
              <div
                key={concept.name}
                className="p-6 rounded-xl border border-border-subtle bg-onyx/30 hover:bg-onyx/60 transition-colors duration-300"
              >
                <h3 className="font-display text-xl italic text-phosphor mb-3">
                  {concept.name}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {concept.desc}
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
            Open source. Production-proven.
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            The AI content engine behind openclaws.blog is fully open source.
            See the AEO audit checklists, content style guides, and publishing
            pipeline your team can adopt today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://openclaws.blog"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-lg bg-phosphor text-void font-medium hover:bg-phosphor-dim transition-colors text-lg"
            >
              See it in action
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
              OpenClaws
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
            <span>AI-assisted content. AEO-optimized.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
