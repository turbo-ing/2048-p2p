"use client";
import { useEffect, useState } from "react";

import { ethers } from "ethers";
import { useUsdtPrice } from "../contexts/UsdtPriceContext";
import swithChain from "../core/switchChain";
import { Home } from "./Home";
import { Navbar } from "./Navbar";
import { PlayNow } from "./PlayNow";

const FullPageSlides = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [balance, setBalance] = useState("");
  const [walletBalance, setWalletBalance] = useState("0");
  const [localPrivateKey, setLocalPrivateKey] = useState("");
  const [account, setAccount] = useState("");
  const [selectedMode, setSelectedMode] = useState(0);

  console.log(account);
  const usdtPrice = useUsdtPrice("ETH");

  useEffect(() => {
    if (window.ethereum) {
      initChain();
    }
  }, []);

  const initChain = async () => {
    console.log("Init chain");
    const chainInvalid = await swithChain();

    if (!chainInvalid) {
      return;
    }

    const p = new ethers.providers.Web3Provider(window.ethereum);

    setProvider(p);
  };

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const fetchBalance = async () => {
    if (provider && wallet) {
      const localPublicKey = await wallet?.getAddress();

      if (!localPublicKey) return;
      const walletBalance = await provider.getBalance(localPublicKey!);
      const walletBalanceInEth = ethers.utils.formatEther(walletBalance);

      setWalletBalance(walletBalanceInEth);
    }

    if (provider) {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const balanceInEth = ethers.utils.formatEther(balance);

      setBalance(balanceInEth);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBalance();
    }, 1000);

    return () => clearInterval(interval);
  }, [provider, wallet]);

  return (
    <div className="relative w-screen h-screen">
      <Navbar
        isDark={activeIndex === 0 ? false : true}
        onClick={() => {
          goToSlide(0);
        }}
      />
      <Home activeIndex={activeIndex} goToSlide={goToSlide} />
      <PlayNow
        activeIndex={activeIndex}
        goToSlide={goToSlide}
        account={account}
        balance={balance}
        provider={provider}
        selectedMode={selectedMode}
        setAccount={setAccount}
        setLocalPrivateKey={setLocalPrivateKey}
        setSelectedMode={setSelectedMode}
        setWallet={setWallet}
        wallet={wallet}
        walletBalance={walletBalance}
      />
    </div>
  );
};

export default FullPageSlides;
