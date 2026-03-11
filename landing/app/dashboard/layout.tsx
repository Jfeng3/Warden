import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/tasks", label: "Tasks", icon: "list" },
  { href: "/dashboard/cron", label: "Cron Jobs", icon: "clock" },
  { href: "/dashboard/scans", label: "Scans", icon: "search" },
];

const Icons: Record<string, React.ReactNode> = {
  grid: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  list: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="5" y1="3" x2="15" y2="3" />
      <line x1="5" y1="8" x2="15" y2="8" />
      <line x1="5" y1="13" x2="15" y2="13" />
      <circle cx="2" cy="3" r="1" fill="currentColor" />
      <circle cx="2" cy="8" r="1" fill="currentColor" />
      <circle cx="2" cy="13" r="1" fill="currentColor" />
    </svg>
  ),
  clock: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="7" />
      <polyline points="8,4 8,8 11,10" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5" />
      <line x1="11" y1="11" x2="15" y2="15" />
    </svg>
  ),
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-void">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-52 flex-col border-r border-border-visible bg-obsidian">
        {/* Brand */}
        <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-5">
          <div className="h-2 w-2 rounded-full bg-phosphor glow-pulse" />
          <Link href="/" className="font-mono text-sm font-medium tracking-wider text-text-primary hover:text-phosphor transition-colors">
            WARDEN
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-onyx hover:text-text-primary [&.active]:bg-onyx [&.active]:text-phosphor"
            >
              <span className="text-text-tertiary">{Icons[item.icon]}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border-subtle px-5 py-4">
          <Link
            href="/"
            className="font-mono text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            &larr; Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-52 flex-1 min-h-screen">
        <div className="mx-auto max-w-6xl px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
