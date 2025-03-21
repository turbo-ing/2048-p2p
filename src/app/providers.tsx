"use client";

import { TurboEdgeProviderV0 } from "@turbo-ing/edge-v0";

import { Game2048Provider } from "@/reducer/2048";
import { MinaSessionKeyProvider } from "./mina/MinaSessionKeyProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinaSessionKeyProvider>
      <TurboEdgeProviderV0 gameId="turbo-2048">
        <Game2048Provider>{children}</Game2048Provider>
      </TurboEdgeProviderV0>
    </MinaSessionKeyProvider>
  );
}
