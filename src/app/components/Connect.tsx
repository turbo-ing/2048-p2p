"use client";
import { contracts } from "@/utils/web3/config";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";

export const Connect = () => {
  const { address } = useAccount();
  const { data, isLoading, isError, error } = useBalance({
    address: address,
    token: contracts.erc20Token.address,
  });
  return (
    <>
      {data?.value && (
        <div className=" bg-red-500 text-white rounded-[12px] rounded-r-none translate-x-3 px-4 align-middle flex items-center">
          <p className="mr-2 flex-inline flex items-center space-x-2">
            <b>{data?.formatted}</b> <span className="text-xs"> Turbo</span>
          </p>
        </div>
      )}
      <ConnectButton showBalance={false} />
    </>
  );
};
