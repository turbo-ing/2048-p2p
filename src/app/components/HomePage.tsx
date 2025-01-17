import { useEffect, useState } from "react";
import Button from "./Button";
import ResponsiveContainer from "./ResponsiveContainer";
import { initBoardWithSeed, use2048, generateRoomCode } from "@/reducer/2048";
import MultiplayerModal from "./MultiplayerModal";
import Mock2048 from "./Mock2048";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";
import ZkClient from "@/workers/zkClient";
import { assignMyPeerId, zkClient } from "@/workers/zkQueue";
import { useRouter } from "next/navigation";
import SinglePlayer from "./icon/Singleplayer";
import Versus from "./icon/Versus";

export const useJoinRoom = () => {
  const [waitingToJoin, setWaitingToJoin] = useState(false);
  const [state, dispatch, connected, room, setRoom] = use2048();
  const [name, setName] = useState("");
  const [numberOfPlayers, setNumOfPlayers] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (waitingToJoin && connected) {
      const [gridBoard, zkBoard] = initBoardWithSeed(
        Math.floor(Math.random() * 100000000000),
      );

      dispatch({
        type: "JOIN",
        payload: {
          name: name,
          grid: gridBoard,
          zkBoard: zkBoard,
          numPlayers: numberOfPlayers,
        },
      });

      setWaitingToJoin(false); // Reset the waiting state
    }
  }, [waitingToJoin, connected, state, room, name, numberOfPlayers, dispatch]);

  const joinRoom = (roomId: string, name: string, numberOfPlayers?: number) => {
    setRoom(roomId);
    setName(name);
    setNumOfPlayers(numberOfPlayers);
    setWaitingToJoin(true);
  };

  return joinRoom;
};

export default function HomePage() {
  const [state, dispatch, connected, room, setRoom] = use2048();
  const turboEdge = useTurboEdgeV0();
  const peerId = turboEdge?.node.peerId.toString();

  const [gameTimerInput, setGameTimerInput] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sentTimer, setSentTimer] = useState(false);

  const router = useRouter();

  // If you're compiling a ZK program on startup, you'd do that here.
  const compileZKProgram = async (zkClient: ZkClient) => {
    const result = await zkClient?.compileZKProgram();
    console.log("Verification Key", result?.verificationKey);
  };

  useEffect(() => {
    // We only consider players "ready" if:
    // 1) There's at least 1 player (totalPlayers > 0)
    // 2) The actual number of players who joined matches totalPlayers
    // 3) We are connected to TurboEdge (turboEdge?.connected === true)
    // 4) We are connected to the 2048 game (the `connected` flag from use2048 === true)
    const allPlayersReady =
      state.totalPlayers > 0 && state.totalPlayers === state.playersCount;

    if (allPlayersReady && turboEdge?.connected && connected) {
      setIsLoading(true);
      setModalOpen(false);

      // If time is set and we haven't sent it yet, dispatch it
      if (gameTimerInput && gameTimerInput > 0 && !sentTimer) {
        setSentTimer(true);
        dispatch({
          type: "TIMER",
          payload: {
            time: gameTimerInput,
            ended: false,
          },
        });
      }

      // Now that everything is ready, redirect to /play
      router.push("/play");
    } else {
      setIsLoading(false);
    }
  }, [
    state.totalPlayers,
    state.playersCount,
    turboEdge?.connected,
    connected,
    gameTimerInput,
    sentTimer,
    dispatch,
    router,
  ]);

  // Assign the peer ID once we have a turboEdge instance
  useEffect(() => {
    if (turboEdge) {
      assignMyPeerId(turboEdge.node.peerId.toString());
    }
  }, [turboEdge]);

  // Set the reducer's dispatch into the ZK client once connected
  useEffect(() => {
    if (connected) {
      zkClient?.setDispatch(dispatch);
    }
  }, [connected, dispatch]);

  const [isModalOpen, setModalOpen] = useState(false);
  const join = useJoinRoom();

  const handleSingleplayer = () => {
    join("solomode-" + generateRoomCode(), "Solo", 1);
  };

  const handleVersus = () => {
    setModalOpen(true);
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-white border-opacity-75" />
            <div className="flex items-center mt-4">
              {!connected && "Connecting to Turbo"}
            </div>
          </div>
        </div>
      )}

      {!turboEdge?.connected && (
        <div className="fixed bottom-0 left-0 w-full bg-black text-white flex justify-center p-2 z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border-t-2"></div>
            <span className="text-sm">Connecting to TurboEdge...</span>
          </div>
        </div>
      )}

      <MultiplayerModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        join={join}
      />

      <ResponsiveContainer
        top={
          <div className="size-full flex items-center justify-center md:items-end">
            <h1 className="flex-none text-8xl font-bold text-center px-2 mt-2 md:text-9xl md:pb-8">
              Turbo
              <br />
              2048
            </h1>
          </div>
        }
        middle={
          <div className="flex-1 h-fit max-w-[600px] px-14 lg:px-20 w-full md:drop-shadow-2xl">
            <Mock2048 />
          </div>
        }
        bottom={
          <div className="flex items-center justify-center flex-col px-6">
            <div className="mb-4 text-center py-3">
              Challenge yourself in single-player mode with zero-knowledge proof
              high scores, or take on the competition in Versus Mode on the
              Turbo Edge P2P network.
            </div>
            <div className="flex sm:flex-row flex-col w-full space-y-2 sm:space-y-0">
              <Button onClick={handleSingleplayer}>
                <div className="text-left flex flex-row items-center hover:text-text">
                  <SinglePlayer size={28} />
                  <div>
                    <div className="ml-2 text-[clamp(1rem, 2.5vw, 2rem)]">
                      Singleplayer
                    </div>
                  </div>
                </div>
              </Button>
              <Button onClick={handleVersus}>
                <div className="flex flex-row items-center hover:text-text">
                  <Versus size={28} />
                  <div className="text-left">
                    <div className="text-[clamp(1rem, 2.5vw, 2rem)]">
                      Versus
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        }
      />
    </>
  );
}
