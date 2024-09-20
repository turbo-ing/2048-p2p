"use client";

import { ChessProvider } from "@/reducer/chess";
import { UsdtPriceProvider } from "./contexts/UsdtPriceContext";
import { TurboEdgeProviderV0 } from "@turbo-ing/edge-v0";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UsdtPriceProvider>
      <TurboEdgeProviderV0>
        <ChessProvider>{children}</ChessProvider>
      </TurboEdgeProviderV0>
    </UsdtPriceProvider>
  );
}
