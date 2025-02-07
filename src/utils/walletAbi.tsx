// TODO: Delete this files

"use client";
import { useAccount, useBalance } from "wagmi";

import { useReadContract } from "wagmi";
import { contracts } from "./web3/config";

export default function CustomTokenComponent() {
  const { address } = useAccount();

  const {
    data: result,
    isLoading,
    isError,
    error,
  } = useBalance({
    address: address,
    token: contracts.erc20Token.address,
  });

  return (
    <div>
      {isLoading && <p>Loading balance...</p>}
      {isError && <p>Error fetching balance.</p>}
      {error?.message && <p>{error.message}</p>}
      {result !== null && result !== undefined && (
        <>
          <p>
            Your token balance: {result?.formatted} {result?.symbol}
          </p>
        </>
      )}
    </div>
  );
}
