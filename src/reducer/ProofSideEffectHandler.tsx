import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";
import { use2048 } from "@/reducer/2048";
import keccak256 from "keccak256";

const Game2048SideEffectHandler: React.FC = () => {
  const { address } = useAccount();
  const turboEdge = useTurboEdgeV0();
  const [state, __, ___, room] = use2048();

  useEffect(() => {
    if (state.compiledProof) {
      if (!turboEdge || !address) {
        console.error("TurboEdge or address not found");
        return;
      }
      const namespace = room + turboEdge.sessionId;
      const hashedNamespace = "0x" + keccak256(namespace).toString("hex");

      fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_CONTRACT_PROXY_URL}submitVerification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            zkProof: state.compiledProof,
            topic: hashedNamespace,
            sessionId: turboEdge.sessionId,
            walletAddress: address,
          }),
        },
      ).catch((err) => console.error(err));
    }
  }, [state.compiledProof, turboEdge, address, room]);

  return null;
};

export default Game2048SideEffectHandler;
