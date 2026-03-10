import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenClaws — AI Content Marketing, Optimized for AI Citation",
  description:
    "Your AI content marketer that drafts AEO-optimized blog posts — structured so ChatGPT, Perplexity, and Google AI Overviews cite your brand as the answer.",
  openGraph: {
    title: "OpenClaws — AI Content Marketing, Optimized for AI Citation",
    description:
      "Your AI content marketer that drafts AEO-optimized posts, structured so AI models cite your brand as the answer.",
    url: "https://openclaws.blog",
    siteName: "OpenClaws",
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
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise">{children}</body>
    </html>
  );
}
