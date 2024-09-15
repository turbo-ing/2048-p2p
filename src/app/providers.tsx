'use client';

import { UsdtPriceProvider } from './contexts/UsdtPriceContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <UsdtPriceProvider>{children}</UsdtPriceProvider>;
}
