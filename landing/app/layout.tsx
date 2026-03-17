import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warden — AI Content Assistant That Gets Your Brand Cited by AI Agents",
  description:
    "An AI content assistant that drafts agent-optimized posts your team reviews — so AI agents cite your brand, not your competitors'. ~$200/post, 8+ drafts/month, 0 missed deadlines.",
  openGraph: {
    title: "Warden — AI Content Assistant That Gets Your Brand Cited by AI Agents",
    description:
      "AI agents cite your brand, not your competitors'. Agent-optimized drafts your team reviews — ~$200/post, 8+ per month.",
    url: "https://openclaws.blog",
    siteName: "Warden",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&family=Manrope:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise">{children}</body>
    </html>
  );
}
