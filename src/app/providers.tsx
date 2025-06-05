"use client";
import { RTCProvider } from "@turbo-ing/turbo-p2p-react";

import { Game2048Provider } from "@/reducer/2048";
import { MinaSessionKeyProvider } from "./mina/MinaSessionKeyProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinaSessionKeyProvider>
      <RTCProvider>
        <Game2048Provider>{children}</Game2048Provider>
      </RTCProvider>
    </MinaSessionKeyProvider>
  );
}
