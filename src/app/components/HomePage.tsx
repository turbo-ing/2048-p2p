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

  // Needed?
  const compileZKProgram = async (zkClient: ZkClient) => {
    const result = await zkClient?.compileZKProgram();
    console.log("Verification Key", result?.verificationKey);
  };

  useEffect(() => {
    if (state.totalPlayers > 0 && state.totalPlayers === state.playersCount) {
      setModalOpen(false);

      if (gameTimerInput > 0 && !sentTimer) {
        setSentTimer(true);
        dispatch({
          type: "TIMER",
          payload: {
            time: gameTimerInput,
            ended: false,
          },
        });
        router.push("/play");
      } else router.push("/play");
    }
  }, [state, dispatch, gameTimerInput, router, sentTimer]);

  useEffect(() => {
    if (turboEdge) {
      assignMyPeerId(turboEdge.node.peerId.toString());
    }
  }, [turboEdge]);

  useEffect(() => {
    if (!connected) return;
    zkClient?.setDispatch(dispatch);
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
      <MultiplayerModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        join={join}
      />
      <ResponsiveContainer
        top={
          <div className="size-full flex items-center justify-center  md:items-end">
            <h1 className="flex-none text-text text-8xl font-bold text-center px-2 mt-2 md:text-9xl md:pb-8">
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
          <div className=" flex items-center justify-center flex-col px-6">
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
                    <div className="ml-2 text-[clamp(1rem, 2.5vw, 2rem)] ">
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
