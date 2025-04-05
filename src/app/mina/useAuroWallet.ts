import { zkClient } from "@/workers/zkClient";
import { useCallback, useEffect, useState } from "react";

export const useAuroWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState<null | boolean>(null);
  const [hasBeenSetup, setHasBeenSetup] = useState(false);
  const [accountExists, setAccountExists] = useState(false);

  const connect = useCallback(async () => {
    try {
      if (!hasBeenSetup) {
        const mina = (window as any).mina;
        if (mina == null) {
          setConnected(false);
          return;
        }

        const publicKeyBase58: string = (await mina.requestAccounts())[0];
        setAddress(publicKeyBase58);
        setConnected(true);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const res = await zkClient.fetchAccount(publicKeyBase58);
        const accountExists = res.error === null;
        setAccountExists(accountExists);

        await zkClient.loadContracts(publicKeyBase58);

        setHasBeenSetup(true);
      }
    } catch (error: any) {
      console.error(`Error during setup: ${error.message}`);
    }
  }, [hasBeenSetup]);

  useEffect(() => {
    connect();
  }, [connect]);

  return { address, connected, accountExists, connect };
};
