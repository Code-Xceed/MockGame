import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'MockGame Admin',
  description: 'Moderation and operations console',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0a0b0f] text-[#e8e6f0] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
