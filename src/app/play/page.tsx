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
  const [lenQueue, setLenQueue] = useState<number>(0);
  const [triggered, setTriggered] = useState<boolean>(false);
  const [allSurrendered, setAllSurrendered] = useState<boolean>(false);
  const [rem, setRem] = useState<number>(0);

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

  const downloadProof = () => {
    console.log(state.compiledProof);
    let json = JSON.parse(state.compiledProof);

    const dataStr =
      "data:application/json;charset=utf-8," + encodeURIComponent(json.proof);
    const download = document.createElement("a");
    download.setAttribute("href", dataStr);
    download.setAttribute("download", "ZK_Proof" + ".json");
    document.body.appendChild(download);
    download.click();
    download.remove();
  };

  const leave = () => {
    console.log("Leaving");
    dispatch({
      type: "LEAVE",
    });
    window.location.href = "/";
    //router.replace("/");
  };

  const rematch = () => {
    console.log("Voting for rematch");
    dispatch({
      type: "REMATCH",
    });
  };

  useDisableScroll(isMobile);

  //State updater for move cache display
  useEffect(() => {
    // only trigger once
    if (!triggered) {
      setInterval(() => {
        console.log("updating lenqueue");
        let len = zkClient.moveCache.length;
        setLenQueue(len);

        let surr = state.surrendered;
        console.log("surr:");
        console.log(surr);
        let allSurr = 0;
        //check if everyone else has surrendered
        for (var key in surr) {
          //count surrenders
          if (state.players[key] !== peerId && surr[key]) {
            allSurr++;
          }
        }
        if (allSurr === state.playersCount - 1 && state.totalPlayers > 1) {
          setAllSurrendered(true);
        }
      }, 1000);
      setTriggered(true);
    }
  });

  //handle rem for rematch
  useEffect(() => {
    let counter = 0;
    let allTrue = true;
    for (let i in state.rematch) {
      if (!state.rematch[i]) allTrue = false;
      else counter++;
    }
    if (allTrue) router.push("/");
    else setRem(counter);
  });

  useEffect(() => {
    const sortedScores = Object.entries(state.score) // Convert to array of [playerId, score]
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
    const sortedPlayers: Player[] = sortedScores.map(([name, score]) => ({
      name: state.players[name],
      score,
    }));

    setRanking(sortedPlayers);
  }, [state]);

  useEffect(() => {
    if (!connected) return;
    zkClient?.setDispatch(dispatch);
  }, [connected, dispatch, zkClient]);

  if (!state || state.playersCount < 1) return router.push("/");

  return (
    <div className="flex">
      <ThemeProvider theme={themeValue}>
        <Navbar
          isDark={true}
          isShowButton={true}
          onClick={() => (window.location.href = "/")}
        />
        <main className="mt-20 w-full h-full text-white text-4xl transition-opacity duration-1000">
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
                    <div className="lg:w-1/2 mx-auto size-full ">
                      <div className="max-w-[365px] mx-auto text-3xl w-[365px] ">
                        <p>zk: {zkClient.moveCache.length}</p>
                        <p>lq: {lenQueue}</p>
                        <Game2048
                          rematch={rematch}
                          rem={rem}
                          downloadProof={downloadProof}
                          key={peerId}
                          className="text-base"
                          dispatchDirection={dispatchDirection}
                          leave={leave}
                          board={state.board[peerId!]}
                          height={80}
                          player={state.players[peerId!]}
                          trueid={state.players[peerId!]}
                          rankingData={ranking}
                          score={state.score[peerId!]}
                          isFinished={state.isFinished}
                          surrendered={state.surrendered}
                          allSurrendered={allSurrendered}
                          totalPlayers={state.totalPlayers}
                          width={80}
                          lenQueue={zkClient.moveCache.length}
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
                                    rematch={rematch}
                                    rem={rem}
                                    downloadProof={downloadProof}
                                    lenQueue={zkClient.moveCache.length}
                                    key={player}
                                    className="text-sm"
                                    dispatchDirection={dispatchDirection}
                                    leave={leave}
                                    board={state.board[player]}
                                    height={40}
                                    player={state.players[player]}
                                    trueid={state.players[peerId!]}
                                    rankingData={ranking}
                                    score={state.score[player]}
                                    isFinished={state.isFinished}
                                    surrendered={state.surrendered}
                                    allSurrendered={allSurrendered}
                                    totalPlayers={state.totalPlayers}
                                    width={40}
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
