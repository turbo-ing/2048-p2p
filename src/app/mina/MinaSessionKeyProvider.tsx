"use client";

import { createContext, useContext, useMemo } from "react";
import { PrivateKey } from "o1js";

const loadOrGenerateKey = () => {
  const storedKey = sessionStorage.getItem("MINA_SESSION_KEY");
  if (storedKey) {
    return PrivateKey.fromBase58(storedKey);
  } else {
    const newKey = PrivateKey.random();
    sessionStorage.setItem("MINA_SESSION_KEY", newKey.toBase58());
    return newKey;
  }
};

const MinaSessionKeyContext = createContext<{
  sessionKey: PrivateKey;
}>({
  sessionKey: PrivateKey.random(),
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
  const sessionKey = useMemo<PrivateKey>(() => loadOrGenerateKey(), []);

  return (
    <MinaSessionKeyContext.Provider value={{ sessionKey }}>
      {children}
    </MinaSessionKeyContext.Provider>
  );
}
