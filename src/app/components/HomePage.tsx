import { useEffect, useState, Suspense } from "react";
import Button from "./Button";
import ResponsiveContainer from "./ResponsiveContainer";
import { use2048, generateRoomCode } from "@/reducer/2048";
import MultiplayerModal from "./MultiplayerModal";
import Mock2048 from "./Mock2048";
import { zkClient, ZkClient } from "@/workers/zkClient";
import { assignMyPeerId } from "@/workers/zkQueue";
import { useRouter } from "next/navigation";
import SinglePlayer from "./icon/Singleplayer";
import Versus from "./icon/Versus";
import TurboEdgeNotification from "./TurboEdgeNotifcation";
import useIsMobile from "../hooks/useIsMobile";
//import { useJoin } from "../hooks/useJoin";
import React from "react";
import Navbar from "./Navbar";
import LeaderboardModal from "./LeaderboardModal";
import { useJoin } from "../hooks/useJoin";

const LazyMock2048 = React.lazy(() => import("./Mock2048"));

export default function HomePage() {
  const [
    state,
    dispatch,
    rtc,
    createRoom,
    joinRoom,
    leaveRoom,
    getRooms,
    rtcConfig,
    rtcPeers,
    zkClient,
  ] = use2048();
  const isMobile = useIsMobile();

  const peerId = rtcConfig?.peer.peerIdString;

  const [gameTimerInput, setGameTimerInput] = useState(0);
  const [sentTimer, setSentTimer] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLeaderboardOpen, setLeaderboardOpen] = useState(false);
  const router = useRouter();

  const handleJoin = (joining: boolean) => {
    if (joining) {
      setIsLoading(true);
      router.push("/play");
    }
  };

  const joinSingleplayer = useJoin(handleJoin);

  // Set the reducer's dispatch into the ZK client once connected
  useEffect(() => {
    if (rtc) {
      zkClient?.setDispatch(dispatch);
    }
  }, [rtc, dispatch]);

  const handleSingleplayer = () => {
    setIsLoading(true);
    joinSingleplayer("solomode-" + generateRoomCode(), "Solo", 1);
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
            {/* <div className="flex items-center mt-4">
              {!connected && (
                <p className="text-white mt-4">Connecting to TurboEdge</p>
              )}
            </div> */}
          </div>
        </div>
      )}

      <TurboEdgeNotification connected={(rtc && true) || false} />

      <MultiplayerModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        pushPlay={() => handleJoin(true)}
      />

      <LeaderboardModal
        open={isLeaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />

      <Navbar />

      <ResponsiveContainer
        top={
          <div className="size-full flex items-center justify-center md:items-end">
            <h1 className="flex-none text-8xl font-bold text-center px-2 mt-2 md:text-9xl md:pb-8">
              Mina
              <br />
              2048
            </h1>
          </div>
        }
        middle={
          <div className="flex-1 h-fit max-w-[600px] px-14 lg:px-20 w-full md:drop-shadow-2xl">
            <Suspense
              fallback={
                <div className="text-center">Loading Game Preview...</div>
              }
            >
              <LazyMock2048 />
            </Suspense>
          </div>
        }
        bottom={
          <div className="flex items-center justify-center flex-col px-6">
            {/* <div className="mb-4 text-center py-3">
              Challenge yourself in single-player mode with zero-knowledge proof
              high scores, or take on the competition in Versus Mode on the
              Turbo Edge P2P network.
            </div> */}
            <div>
              {!isMobile.isMobileByUserAgent ? (
                <>
                  <div className="flex flex-row w-full space-x-2">
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

                  <div className="flex flex-row w-full space-x-2 mt-2">
                    <Button onClick={() => setLeaderboardOpen(true)}>
                      <div className="text-left flex flex-row items-center hover:text-text">
                        <SinglePlayer size={28} />
                        <div>
                          <div className="ml-2 text-[clamp(1rem, 2.5vw, 2rem)]">
                            Leaderboard
                          </div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-center">
                  <h1 className="text-3xl font-semibold">
                    Best Viewed on Desktop
                  </h1>
                  <p className=" text-lg">
                    For a smoother experience and access to all features, visit
                    this site on desktop.
                  </p>
                </div>
              )}
            </div>
          </div>
        }
      />
    </>
  );
}
