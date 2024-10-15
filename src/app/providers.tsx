"use client";

import { TurboEdgeProviderV0 } from "@turbo-ing/edge-v0";

import { Game2048Provider } from "@/reducer/2048";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TurboEdgeProviderV0>
      <Game2048Provider>{children}</Game2048Provider>
    </TurboEdgeProviderV0>
  );
}
