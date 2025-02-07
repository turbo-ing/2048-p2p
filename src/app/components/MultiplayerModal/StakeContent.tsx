"use client";

import { useEffect, useState } from "react";
import keccak256 from "keccak256";
import {
  type BaseError,
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";
import { use2048 } from "@/reducer/2048";
import { contracts } from "@/utils/web3/config";
import Button from "../Button";

interface StakeContentProps {
  onSubmitStake: () => Promise<void>;
}

export default function StakeContent({ onSubmitStake }: StakeContentProps) {
  const { address } = useAccount();

  /**
   * Fetch user's balance to check if < 10
   */
  const { data: balance, refetch: refetchBalance } = useBalance({
    address,
    token: contracts.erc20Token.address,
  });

  const insufficientBalance =
    Number(balance?.value) / (balance?.decimals ?? 1) < 10;

  /**
   * Approve transaction
   */
  const {
    data: approveHash,
    error: approveError,
    isPending: isApprovePending,
    writeContract: writeApprove,
  } = useWriteContract();

  const {
    data: approveReceipt,
    isLoading: isApproveConfirming,
    isSuccess: isApproveConfirmed,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  /**
   * Stake transaction
   */
  const {
    data: stakeHash,
    error: stakeError,
    isPending: isStakePending,
    writeContract: writeStake,
  } = useWriteContract();

  const {
    data: stakeReceipt,
    isLoading: isStakeConfirming,
    isSuccess: isStakeConfirmed,
  } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });

  /**
   * Access 2048 + TurboEdge state
   */
  const turboEdge = useTurboEdgeV0();
  const [state, dispatch, connected, room] = use2048();

  /**
   * Local state for faucet request
   */
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetError, setFaucetError] = useState<string | null>(null);
  const [faucetSuccess, setFaucetSuccess] = useState<string | null>(null);

  /**
   * Console-log any approve or stake hashes
   */
  useEffect(() => {
    if (approveHash) {
      console.log("Approval TX Hash:", approveHash);
    }
  }, [approveHash]);

  useEffect(() => {
    if (stakeHash) {
      console.log("Stake TX Hash:", stakeHash);
    }
  }, [stakeHash]);

  /**
   * Console-log the transaction receipts
   */
  useEffect(() => {
    if (approveReceipt) {
      console.log("Approval transaction receipt:", approveReceipt);
    }
  }, [approveReceipt]);

  useEffect(() => {
    if (stakeReceipt) {
      console.log("Stake transaction receipt:", stakeReceipt);
    }
  }, [stakeReceipt]);

  /**
   * Once approval is confirmed, automatically stake
   */
  useEffect(() => {
    if (isApproveConfirmed && turboEdge) {
      const namespace = room + turboEdge.sessionId;
      const hashedNamespace = "0x" + keccak256(namespace).toString("hex");

      writeStake({
        ...contracts.backendStakePool,
        functionName: "stake",
        args: [hashedNamespace],
      });
    }
  }, [isApproveConfirmed, turboEdge, room, writeStake]);

  /**
   * Once staking is confirmed, invoke callback
   */
  useEffect(() => {
    if (isStakeConfirmed) {
      onSubmitStake?.();
    }
  }, [isStakeConfirmed, onSubmitStake]);

  /**
   * Click handler for approving 10 tokens
   */
  async function handleStake() {
    if (!turboEdge) {
      console.error("Turbo Edge is not available.");
      return;
    }

    // Approve 10 tokens (10e18)
    const stakeAmount = BigInt(10 * 10 ** 18);

    try {
      writeApprove({
        ...contracts.erc20Token,
        functionName: "approve",
        args: [contracts.backendStakePool.address, stakeAmount],
      });
    } catch (err) {
      console.error("Approve call failed:", err);
    }
  }

  /**
   * Enhanced faucet handling
   */
  const handleFaucet = async () => {
    setFaucetLoading(true);
    setFaucetError(null);
    setFaucetSuccess(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_CONTRACT_PROXY_URL}/requestFaucet`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ walletAddress: address }),
        },
      );

      if (!response.ok) {
        // Attempt to parse server error message
        const errorData = await response.json().catch(() => null);
        const errorMsg =
          errorData?.message ||
          "Something went wrong. Please check the faucet service.";
        throw new Error(errorMsg);
      }

      // In case the server returns a success message or any data
      const data = await response.json().catch(() => ({}));
      console.log("Faucet response:", data);

      setFaucetSuccess("Successfully received faucet tokens!");
      // Refresh balance to reflect updated funds
      await refetchBalance();
    } catch (err: any) {
      console.error("Faucet call failed:", err);
      setFaucetError(err?.message ?? "Faucet call failed. Try again later.");
    } finally {
      setFaucetLoading(false);
    }
  };

  return (
    <div className="mt-2 transition-all">
      <p className="font-semibold text-2xl md:text-4xl">Submit Your Stake</p>
      <p className="text-sm mt-2 mb-4">
        Submit a stake to the prize pool, to be claimed by the winner of the
        game.
      </p>

      {insufficientBalance ? (
        <>
          <Button
            onClick={handleFaucet}
            className="w-full"
            disabled={faucetLoading}
          >
            {faucetLoading ? "Requesting Faucet..." : "Receive 10 Turbo"}
          </Button>

          {faucetSuccess && (
            <div className="mt-2 text-green-500 text-sm">{faucetSuccess}</div>
          )}
          {faucetError && (
            <div className="mt-2 text-red-500 text-sm">{faucetError}</div>
          )}
        </>
      ) : (
        <Button
          onClick={handleStake}
          className="w-full"
          disabled={
            isApprovePending ||
            isApproveConfirming ||
            isStakePending ||
            isStakeConfirming
          }
        >
          {isApprovePending
            ? "Waiting for wallet..."
            : isApproveConfirming
              ? "Approving..."
              : isStakePending
                ? "Confirming stake in wallet..."
                : isStakeConfirming
                  ? "Staking..."
                  : "Stake 10 Turbo"}
        </Button>
      )}

      {/* Display transaction errors (if any) */}
      {(approveError || stakeError) && (
        <div className="mt-2 text-red-500">
          {approveError && (
            <div>
              Approve error:{" "}
              {(approveError as BaseError)?.shortMessage ??
                approveError.message}
            </div>
          )}
          {stakeError && (
            <div>
              Stake error:{" "}
              {(stakeError as BaseError)?.shortMessage ?? stakeError.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
