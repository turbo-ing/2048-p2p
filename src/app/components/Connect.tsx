"use client";
import { contracts } from "@/utils/web3/config";
import { usePrivy, PrivyInterface } from "@privy-io/react-auth";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import Button from "./Button";
import SinglePlayer from "./icon/Singleplayer";

export const CB = (privy: PrivyInterface) => {
  const { address } = useAccount();
  const { data, isLoading, isError, error } = useBalance({
    address: address,
    token: contracts.erc20Token.address,
  });
  if (!data?.value) {
    //if not logged in
    return (
      <Button onClick={privy.connectOrCreateWallet}>
        <div className="text-left flex flex-row items-center hover:text-text">
          <SinglePlayer size={28} />
          <div>
            <div className="ml-2 text-[clamp(1rem, 2.5vw, 2rem)]">
              Connect Wallet
            </div>
          </div>
        </div>
      </Button>
    );
  } else return <ConnectButton showBalance={false} />;
};

export const Connect = () => {
  const privy = usePrivy();
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
      {CB(privy)}
    </>
  );
};
