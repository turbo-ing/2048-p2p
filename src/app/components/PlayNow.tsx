import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { generateRoomCode, initBoardWithSeed, use2048 } from "@/reducer/2048";
import ZkClient from "@/workers/zkClient";
import { assignMyPeerId, zkClient } from "@/workers/zkQueue";
import MultiplayerModal from "./MultiplayerModal";
import { useJoinRoom } from "../hooks/useJoinRoom";
import Button from "./Button";

// interface PlayNowProps {
//   activeIndex: number;
//   setSelectedMode: Dispatch<SetStateAction<number>>;
//   selectedMode: number;
//   goToSlide: (index: number) => void;
// }

export const PlayNow = () => {
  const [state, dispatch, connected, room, setRoom] = use2048();
  const turboEdge = useTurboEdgeV0();
  const peerId = turboEdge?.node.peerId.toString();

  const [isModalOpen, setModalOpen] = useState(false);

  const join = useJoinRoom();

  const [gameTimerInput, setGameTimerInput] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sentTimer, setSentTimer] = useState(false);

  const router = useRouter();

  const compileZKProgram = async (zkClient: ZkClient) => {
    const result = await zkClient?.compileZKProgram();
    console.log("Verification Key", result?.verificationKey);
  };

  // Button handler for openin modal
  const playWithFriend = () => {
    setModalOpen(true);
  };

  const handleSoloPlay = () => {
    join("solomode-" + generateRoomCode(), "Solo", 1);
  };

  useEffect(() => {
    // console.log("state", state);
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
  }, [state]);

  useEffect(() => {
    if (turboEdge) {
      assignMyPeerId(turboEdge.node.peerId.toString());
    }
  }, [turboEdge]);

  useEffect(() => {
    if (!connected) return;
    zkClient?.setDispatch(dispatch);
  }, [connected, dispatch, zkClient]);

  return (
    <>
      <MultiplayerModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        join={join}
      />
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
      <div
        className={`absolute inset-0 w-full h-full text-text text-4xl transition-opacity duration-1000`}
      >
        <div className="h-full bg-background">
          <div className="md:grid md:grid-cols-2 md:gap-4 md:content-center h-full md:pt-20 lg:px-8 px-4 max-w-7xl mx-auto pt-28">
            <div className="md:order-last flex items-center justify-center mb-8 md:mb-0">
              <div>
                <img
                  alt=""
                  className="md:max-h-40 max-h-32"
                  src="/img/2048_bg.png"
                />
              </div>
            </div>
            <div>
              <div>
                <p className="text-[clamp(2rem, 50vh, 20rem)] font-semibold mb-4 text-center">
                  Turbo 2048
                </p>
                <p className="text-[clamp(1rem, 3vw, 2.5rem)] font-semibold">
                  Dive into the Decentralized 2048 Experience! Powered by Turbo
                </p>
              </div>
              <div>
                <div className="flex flex-row">
                  <Button onClick={handleSoloPlay}>
                    <div className="text-left flex-row flex">
                      <img
                        alt=""
                        className="w-12 h-12 lg:w-auto lg:h-auto"
                        src="/svg/2048-play.svg"
                      />
                      <div className="text-left">
                        <div className="text-2xl lg:text-5xl font-semibold">
                          Singleplayer
                        </div>
                        <div className="text-base lg:text-xl font-medium mt-1">
                          Challenge Yourself!
                        </div>
                      </div>
                    </div>
                  </Button>
                  <Button
                    onClick={function (): Promise<void> | void {
                      throw new Error("Function not implemented.");
                    }}
                  >
                    <img
                      alt=""
                      className="w-16 h-16 lg:w-auto lg:h-auto"
                      src="/svg/2048-invite.svg"
                    />
                    <div className="text-[#FCFCFD] text-left">
                      <div className="text-2xl lg:text-5xl font-semibold">
                        Versus
                      </div>
                      <div className="text-[#E4E7EC] text-base lg:text-xl font-medium mt-1">
                        Battle others
                      </div>
                    </div>
                  </Button>
                </div>
                <button
                  className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center w-full"
                  disabled={!turboEdge}
                  onClick={handleSoloPlay}
                >
                  <img
                    alt=""
                    className="w-16 h-16 lg:w-auto lg:h-auto"
                    src="/svg/2048-play.svg"
                  />
                  <div className="text-left">
                    <div className="text-2xl lg:text-5xl font-semibold">
                      Classic 2048
                    </div>
                    <div className="text-base lg:text-xl font-medium mt-1">
                      Challenge Yourself!
                    </div>
                  </div>
                </button>
                <button
                  className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center w-full"
                  disabled={!turboEdge}
                  onClick={playWithFriend}
                >
                  <img
                    alt=""
                    className="w-16 h-16 lg:w-auto lg:h-auto"
                    src="/svg/2048-invite.svg"
                  />
                  <div className="text-[#FCFCFD] text-left">
                    <div className="text-2xl lg:text-5xl font-semibold">
                      Invite a Friend
                    </div>
                    <div className="text-[#E4E7EC] text-base lg:text-xl font-medium mt-1">
                      Invite a friend for a private match!
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
