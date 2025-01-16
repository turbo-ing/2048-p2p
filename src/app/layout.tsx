import type { Metadata } from "next";

import { Rubik } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const rubik = Rubik({ subsets: ["latin"] });

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
    <html className="dark text-text bg-background" lang="en">
      <body className={`${rubik.className} w-screen h-screen overflow-hidden `}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
