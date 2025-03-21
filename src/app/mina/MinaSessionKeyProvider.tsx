"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { PrivateKey } from "o1js";

const MinaSessionKeyContext = createContext<{
  privateKey: PrivateKey | null;
}>({
  privateKey: null,
});

export function useMinaSessionKey() {
  const context = useContext(MinaSessionKeyContext);
  if (!context) {
    throw new Error(
      "useMinaSessionKey must be used within MinaSessionKeyProvider",
    );
  }
  return context;
}

export function MinaSessionKeyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [privateKey, setPrivateKey] = useState<PrivateKey | null>(null);

  useEffect(() => {
    const loadOrGenerateKey = () => {
      const storedKey = sessionStorage.getItem("MINA_SESSION_KEY");
      if (storedKey) {
        setPrivateKey(PrivateKey.fromBase58(storedKey));
      } else {
        const newKey = PrivateKey.random();
        sessionStorage.setItem("MINA_SESSION_KEY", newKey.toBase58());
        setPrivateKey(newKey);
      }
    };

    loadOrGenerateKey();
  }, []);

  return (
    <MinaSessionKeyContext.Provider value={{ privateKey }}>
      {children}
    </MinaSessionKeyContext.Provider>
  );
}
