import type { Metadata } from "next";

import "@rainbow-me/rainbowkit/styles.css";
import { Rubik } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";
import { ConnectButton } from "@rainbow-me/rainbowkit";
// import CustomTokenComponent from "@/utils/walletAbi";
import { Connect } from "./components/Connect";
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
  // const { data, isLoading, isError, error } = useBalance({
  //   token: contracts.erc20Token.address,
  // });

  return (
    <html className="dark text-text bg-background" lang="en">
      <body
        className={`${rubik.className} w-screen h-[100dvh] overflow-hidden `}
      >
        <Providers>
          <div className="absolute top-5 right-10 z-[100] inline-flex">
            <Connect />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
