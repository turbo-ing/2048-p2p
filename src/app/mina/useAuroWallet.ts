import { zkClient } from "@/workers/zkClient";
import { useCallback, useEffect, useRef, useState } from "react";

export const useAuroWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState<null | boolean>(null);
  const hasBeenSetup = useRef(false);
  const [accountExists, setAccountExists] = useState(false);

  const [compiled, setCompiled] = useState<boolean>(false);
  const [scoreExists, setScoreExists] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(0);

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
    if (compiled && accountExists && address && connected) {
      zkClient.fetch2048Score(address).then((scoreRes) => {
        const scoreExists = !scoreRes.error;
        console.log("scoreRes", scoreRes);
        setScoreExists(scoreExists);
        setHighScore(Number(scoreRes.balance));
      });
    }
  }, [compiled, accountExists, address, connected]);

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
      setCompiled(true);
    });
  }, []);

  return { address, connected, accountExists, connect, scoreExists, highScore };
};
