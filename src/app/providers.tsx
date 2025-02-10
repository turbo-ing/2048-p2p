"use client";
import { TurboEdgeProviderV0 } from "@turbo-ing/edge-v0";
import { Game2048Provider } from "@/reducer/2048";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  DisclaimerComponent,
} from "@rainbow-me/rainbowkit";
import { config, queryClient } from "@/utils/web3/config";

const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
  <Text>
    By connecting your wallet, you agree to the{" "}
    <Link href="https://turbo.ing">Terms of Service</Link> and acknowledge you
    have read and understand the protocol{" "}
    <Link href="https://turbo.ing">Disclaimer</Link>
  </Text>
);

const appInfo = {
  appName: "Turbo",
  learnMoreUrl: "https://turbo.ing",
  disclaimer: Disclaimer,
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider appInfo={appInfo}>
          <TurboEdgeProviderV0 gameId="turbo-2048">
            <Game2048Provider>{children}</Game2048Provider>
          </TurboEdgeProviderV0>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
