import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from '@/lib/providers';
import './globals.css';

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
});

export const metadata: Metadata = {
  title: 'MockGame — Competitive Exam Battles',
  description:
    'Transform exam preparation into ranked competitive battles. Real-time 1v1 matchmaking, Elo rating, and performance analytics.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
