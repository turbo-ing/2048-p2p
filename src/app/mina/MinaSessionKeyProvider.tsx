"use client";

import { createContext, useContext, useMemo } from "react";
import { PrivateKey } from "o1js";

let sessionKey: PrivateKey;

export const minaSessionKey = () => {
  if (sessionKey) {
    return sessionKey;
  }

  if (typeof window === "undefined") {
    sessionKey = PrivateKey.random();
  }

  const storedKey = window.sessionStorage.getItem("MINA_SESSION_KEY");
  if (storedKey) {
    sessionKey = PrivateKey.fromBase58(storedKey);
  } else {
    sessionKey = PrivateKey.random();
    window.sessionStorage.setItem("MINA_SESSION_KEY", sessionKey.toBase58());
  }
  return sessionKey;
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
  const sessionKey = useMemo<PrivateKey>(() => minaSessionKey(), []);

  return (
    <MinaSessionKeyContext.Provider value={{ sessionKey }}>
      {children}
    </MinaSessionKeyContext.Provider>
  );
}
