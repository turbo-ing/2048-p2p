import type { Metadata } from "next";

import { Rubik } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Turbo 2048",
  description:
    "Experience Turbo 2048, the revolutionary serverless game powered by Turbo Edge's cutting-edge peer-to-peer technology. Enjoy a secure, decentralized gaming experience with zero-knowledge protocols that protect your privacy and prevent cheating.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark text-text bg-background" lang="en">
      <body
        className={`${rubik.className} w-screen h-[100dvh] overflow-hidden `}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
