import type { Metadata } from 'next';

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chess',
  description: '',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark text-foreground bg-background" lang="en">
      <body className={`${inter.className} w-screen h-screen relative`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
