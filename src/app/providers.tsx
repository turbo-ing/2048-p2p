"use client";

import { TurboEdgeProviderV0 } from "@turbo-ing/edge-v0";

import { UsdtPriceProvider } from "./contexts/UsdtPriceContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UsdtPriceProvider>
      <TurboEdgeProviderV0>
        {children}
        {/*<ChessProvider>{children}</ChessProvider>*/}
        {/*<Game2048Provider>{children}</Game2048Provider>*/}
      </TurboEdgeProviderV0>
    </UsdtPriceProvider>
  );
}
