import { zkClient } from "@/workers/zkClient";
import { useCallback, useEffect, useRef, useState } from "react";

export const useAuroWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState<null | boolean>(null);
  const hasBeenSetup = useRef(false);
  const [accountExists, setAccountExists] = useState(false);

  const [compiled, setCompiled] = useState<boolean>(false);

  const refreshWallet = useCallback(async () => {
    const mina = (window as any).mina;
    if (mina == null) {
      setConnected(false);
      return;
    }

    const publicKeyBase58: string = (await mina.requestAccounts())[0];
    setAddress(publicKeyBase58);
    setConnected(true);

    return publicKeyBase58;
  }, []);

  const connect = useCallback(async () => {
    try {
      if (!hasBeenSetup.current) {
        const mina = (window as any).mina;
        if (mina == null) {
          setConnected(false);
          return;
        }

        const publicKeyBase58 = await refreshWallet();
        if (publicKeyBase58 == null) {
          setConnected(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const res = await zkClient.fetchAccount(publicKeyBase58);
        const accountExists = !res.error;
        console.log("accountRes", res);
        setAccountExists(accountExists);

        hasBeenSetup.current = true;
      }
    } catch (error: any) {
      console.error(`Error during setup: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    connect();

    if (typeof window !== "undefined") {
      (window as any).mina.addListener("accountsChanged", connect);
    }

    return () => {
      if (typeof window !== "undefined") {
        (window as any).mina.removeListener("accountsChanged", connect);
      }
    };
  }, [connect]);

  useEffect(() => {
    zkClient.loadContracts().then((result) => {
      console.log("Verification Key:", result);
      if (result) {
        setCompiled(true);
      }
    });
  }, []);

  return { address, connected, accountExists, connect };
};
