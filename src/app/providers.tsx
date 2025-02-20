"use client";
import { TurboEdgeProviderV0 } from "@turbo-ing/edge-v0";
import { Game2048Provider } from "@/reducer/2048";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  DisclaimerComponent,
} from "@rainbow-me/rainbowkit";
import { config, queryClient } from "@/utils/web3/config";
import { privyConfig } from "@/utils/web3/privyConfig";

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
  //ignore the appId error haha it has no clue
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

/*
export function Providers({ children }: { children: React.ReactNode }) {
  //ignore the appId error haha it has no clue
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider appInfo={appInfo}>
            <TurboEdgeProviderV0 gameId="turbo-2048">
              <Game2048Provider>{children}</Game2048Provider>
            </TurboEdgeProviderV0>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
*/
