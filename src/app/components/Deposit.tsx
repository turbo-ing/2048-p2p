import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import { depositVault } from '../core/link';
import { useUsdtPrice } from '../contexts/UsdtPriceContext';

interface DepositVaultProps {
  provider: ethers.providers.Web3Provider | null;
  wallet: ethers.Wallet | null;
  onDepositSubmit: () => void;
  onDepositCancel: () => void;
}

export const DepositVault = ({
  provider,
  onDepositSubmit,
  onDepositCancel,
  wallet,
}: DepositVaultProps) => {
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('');
  const [walletBalance, setWalletBalance] = useState('0');

  const usdtPrice = useUsdtPrice('ETH');

  const fetchBalance = async () => {
    if (provider && wallet) {
      const balance = await provider.getBalance(wallet.address);
      const balanceInEth = ethers.utils.formatEther(balance);

      setBalance(balanceInEth);

      const localPublicKey = await wallet?.getAddress();

      if (!localPublicKey) return;
      const walletBalance = await provider.getBalance(localPublicKey!);
      const walletBalanceInEth = ethers.utils.formatEther(walletBalance);

      setWalletBalance(walletBalanceInEth);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBalance();
    }, 5000);

    return () => clearInterval(interval);
  }, [provider, wallet]);

  const getAmountInUsdt = () => {
    if (!amount) return 0;

    return usdtPrice ? (parseFloat(amount) * usdtPrice).toFixed(2) : 0;
  };

  const getWalletBalanceInUsdt = () => {
    if (!walletBalance) return 0;

    return usdtPrice ? (parseFloat(walletBalance) * usdtPrice).toFixed(2) : 0;
  };

  return (
    <div>
      <img alt="" src="/svg/wallet-icon.svg" />
      <div className="mt-4">
        <div className="text-[#F5F5F6] font-semibold text-lg">
          Deposit to Vault
        </div>
        <div className="mt-1 text-sm text-[#94969C]">
          Ensure smooth transactions by depositing for gas fees. (Minimum $5).
        </div>
      </div>
      <div className="mt-4 border border-[#1F242F] bg-[#161B26] p-4 rounded-[20px]">
        <div className="flex justify-between items-center">
          <input
            className="bg-transparent text-2xl font-bold w-1/4 focus-visible:outline-none"
            placeholder="0.005"
            type="text"
            onChange={(e) => {
              setAmount(e.target.value);
              console.log(e.target.value);
            }}
          />
          <div className="font-medium text-[#94969C] text-sm">
            ${getAmountInUsdt()}
          </div>
          <div className="rounded-full py-2 px-3 justify-center items-center gap-1 border-2 border-[#FFFFFF1F] bg-[#F23939] shadow flex">
            <img alt="" src="/svg/eth.svg" />
            <div className="text-lg font-semibold">ETH</div>
          </div>
        </div>
        <div className="text-sm font-semibold text-right mt-3">
          <span className="text-[#94969C]">Bal: </span>
          <span className="text-[#F5F5F6]">{(+balance).toFixed(4)} ETH </span>
        </div>

        <div className="text-sm font-semibold text-right mt-3">
          <span className="text-[#94969C]">Vault balance: </span>
          <span className="text-[#F5F5F6]">
            {(+walletBalance).toFixed(4)} ETH{' '}
            <span className="text-yellow-500">
              ($ {getWalletBalanceInUsdt()})
            </span>
          </span>
        </div>
      </div>
      <button
        className="rounded-full py-2.5 px-4 text-white flex justify-center bg-[#F23939] w-full mt-4"
        onClick={async () => {
          depositVault({
            provider: provider!,
            to: (await wallet?.getAddress()) ?? '',
            value: ethers.utils.parseEther(amount),
          });
          onDepositSubmit();
        }}
      >
        Deposit
      </button>
      <button
        className="rounded-full py-2.5 px-4 text-[#344054] flex justify-center bg-white w-full my-4"
        onClick={() => {
          onDepositCancel();
        }}
      >
        Skip
      </button>
      <div className="text-center text-xs">
        Low on funds? Use the faucet to get some tokens and keep playing.
      </div>
    </div>
  );
};
