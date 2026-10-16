import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import './globals.css';

const DESCRIPTION =
  "A recreation of the Defects and Reviews System built at Samsung Electronics' printing division in 2016-2017: defect tracking, code review and a bridge across IBM Rational, Review Board, Perforce, Helix Swarm, Jira and Confluence.";

export const metadata: Metadata = {
  // Absolute URLs for link previews. Change it if the demo moves.
  metadataBase: new URL('https://samsung-drs-demo.subwaymatch.workers.dev'),
  title: { default: 'Defects and Reviews System (DRS)', template: '%s - DRS' },
  description: DESCRIPTION,
  icons: { icon: '/drs-logo.svg', apple: '/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    siteName: 'DRS demo',
    title: 'Defects and Reviews System (DRS)',
    description: DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'DRS Insights: the seven-system diagram and defect and code review metrics' }]
  },
  twitter: { card: 'summary_large_image', title: 'Defects and Reviews System (DRS)', description: DESCRIPTION, images: ['/og-image.png'] }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
