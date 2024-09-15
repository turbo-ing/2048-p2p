import { ethers } from "ethers";
import { useState } from "react";
import { depositVault } from "../core/link";

interface DepositVaultProps {
  provider: ethers.providers.Web3Provider | null;
  onCLick1: () => void;
  onCLick2: () => void;
}

export const DepositVault = ({
  provider,
  onCLick1,
  onCLick2,
}: DepositVaultProps) => {
  const [amount, setAmount] = useState("");

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
            className="bg-transparent text-2xl font-bold w-1/4"
            placeholder="0.005"
            type="text"
            onChange={(e) => {
              setAmount(e.target.value);
              console.log(e.target.value);
            }}
          />
          <div className="font-medium text-[#94969C] text-sm">$5.08</div>
          <div className="rounded-full py-2 px-3 justify-center items-center gap-1 border-2 border-[#FFFFFF1F] bg-[#F23939] shadow flex">
            <img alt="" src="/svg/eth.svg" />
            <div className="text-lg font-semibold">ETH</div>
          </div>
        </div>
        <div className="text-sm font-semibold text-right mt-3">
          <span className="text-[#94969C]">Bal: </span>
          <span className="text-[#F5F5F6]">200.852 ETH </span>
          <span className="text-[#CECFD2] ml-2">Max</span>
        </div>
      </div>
      <button
        className="rounded-full py-2.5 px-4 text-white flex justify-center bg-[#F23939] w-full mt-4"
        onClick={() => {
          depositVault({ provider: provider!, to: "", value: Number(amount) });
          onCLick1();
        }}
      >
        Deposit
      </button>
      <button
        className="rounded-full py-2.5 px-4 text-[#344054] flex justify-center bg-white w-full my-4"
        onClick={() => {
          onCLick2();
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
