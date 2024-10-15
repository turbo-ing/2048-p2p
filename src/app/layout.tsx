import type { Metadata } from "next";

import { Inter } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Turbo 2048 - BlockKnight",
  description:
    "Serverless P2P 2048 in Decentralized Web3 Era! BlockKnight is powered by Turbo Edge’s peer-to-peer technology offers a decentralized, secure, and thrilling chess experience—right in your browser with zero servers!",
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
