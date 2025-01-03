"use client";

import { ThemeProvider } from "styled-components";
import { useEffect, useRef, useState } from "react";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";
import { useRouter } from "next/navigation";

import { Navbar } from "@/app/components/Navbar";
import useTheme from "@/app/hooks/useTheme";
import Game2048 from "@/app/components/2048Game";
import { use2048 } from "@/reducer/2048";
import { Player } from "@/app/components/ResultModal";
import useIsMobile from "@/app/hooks/useIsMobile";
import { useDisableScroll } from "@/app/hooks/useSwipe";
import { MoveType } from "@/utils/constants";

export default function Game2048Page() {
  const router = useRouter();
  const [state, dispatch, connected, , , zkClient] = use2048();
  const isMobile = useIsMobile();
  const turboEdge = useTurboEdgeV0();
  const peerId = turboEdge?.node.peerId.toString();
  const [ranking, setRanking] = useState<Player[]>([]);
  const isInitialized = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [{ name: themeName, value: themeValue }] = useTheme("dark");

  const dispatchDirection = async (dir: MoveType) => {
    switch (dir) {
      case "up":
        dispatch({
          type: "MOVE",
          payload: "up",
        });
        break;
      case "down":
        dispatch({
          type: "MOVE",
          payload: "down",
        });
        break;
      case "left":
        dispatch({
          type: "MOVE",
          payload: "left",
        });
        break;
      case "right":
        dispatch({
          type: "MOVE",
          payload: "right",
        });
        break;
      default:
        return;
    }
  };

  useDisableScroll(isMobile);

  useEffect(() => {
    const sortedScores = Object.entries(state.score) // Convert to array of [playerId, score]
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
    const sortedPlayers: Player[] = sortedScores.map(([name, score]) => ({
      name: state.players[name],
      score,
    }));

    setRanking(sortedPlayers);

    const calculateProof = async () => {
      if (!zkClient) return;

      const remotePeerId = state.actionPeerId;
      const dir = state.actionDirection;

      console.log("remotePeerId", remotePeerId);
      console.log("dir", dir);

      if (!remotePeerId || remotePeerId != peerId) return;

      // init first proof for each player if not exists
      if (!isInitialized.current) {
        if (!state.zkBoard[remotePeerId]) return;
        isInitialized.current = true;
        zkClient
          .initZKProof(state.zkBoard[remotePeerId])
          .then(() => {
            // isInitialized.current = false;
            console.log(`Initialized proof for ${remotePeerId}`);
          })
          .catch((err) => {
            console.error(`Error initializing proof for ${remotePeerId}`, err);
          });
      }

      // add move to cache and generate proof if enough moves to batch
      if (!dir) return;
      zkClient.addMove(state.zkBoard[remotePeerId], dir).catch(console.error);
    };

    calculateProof().catch(console.error);
  }, [state]);

  useEffect(() => {
    if (!connected) return;
    zkClient?.setDispatch(dispatch);
  }, [connected]);

  if (!state || state.playersCount < 1) return router.push("/");

  return (
    <div>
      <ThemeProvider theme={themeValue}>
        <Navbar isDark={true} isShowButton={true} />
        <main className="absolute inset-0 w-full h-full text-white text-4xl transition-opacity duration-1000 lg:pt-20">
          <div
            className="h-full"
            style={{
              backgroundImage: "url('/img/2048_home_bg.png')",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="max-w-7xl mx-auto lg:px-8">
              {!state || state.playersCount < 1 ? (
                <div className="items-center">Loading</div>
              ) : (
                <div className="flex items-center min-h-[calc(100vh-80px)] max-w-[960px] mx-auto">
                  <div className="w-full flex lg:flex-row flex-col justify-center lg:-mx-5">
                    <div className="lg:w-1/2 px-5 w-full">
                      <div className="max-w-[365px] mx-auto text-3xl">
                        <Game2048
                          key={peerId}
                          className="text-base"
                          dispatchDirection={dispatchDirection}
                          grid={state.board[peerId!]}
                          player={state.players[peerId!]}
                          rankingData={ranking}
                          score={state.score[peerId!]}
                        />
                      </div>
                    </div>
                    {state.playersCount > 1 && (
                      <div className="relative flex flex-row flex-wrap lg:w-1/2 w-full px-5 lg:-mx-2.5 gap-y-2 lg:before:bg-white lg:before:content-[''] lg:before:absolute lg:before:left-0 lg:before:top-[10%] lg:before:bottom-[10%] lg:before:w-[1px]">
                        {!isMobile &&
                          state.playerId.map(
                            (player) =>
                              player !== peerId && (
                                <div
                                  key={`${player}-id`}
                                  className="w-1/2 px-2.5 text-xl"
                                >
                                  <Game2048
                                    key={player}
                                    className="text-sm"
                                    dispatchDirection={dispatchDirection}
                                    grid={state.board[player]}
                                    player={state.players[player]}
                                    rankingData={ranking}
                                    score={state.score[player]}
                                  />
                                </div>
                              ),
                          )}
                        <div className="lg:w-1/2 px-2.5 lg:text-xl w-full text-base">
                          <p className="text-center text-2xl mb-2">Ranking</p>
                          <ul className="counter-list">
                            {ranking.map((player) => (
                              <li
                                key={player.name}
                                className="flex justify-between relative px-5 mb-2 last:mb-0"
                              >
                                <p>{player.name}</p>
                                <p>{player.score}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </ThemeProvider>
    </div>
  );
}
