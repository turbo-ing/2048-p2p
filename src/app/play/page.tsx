"use client";

import { ThemeProvider } from "styled-components";
import { useEffect, useState } from "react";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";

import { Navbar } from "@/app/components/Navbar";
import useTheme from "@/app/hooks/useTheme";
import Game2048 from "@/app/components/2048Game";
import { use2048 } from "@/reducer/2048";
import { Player } from "@/app/components/ResultModal";

export default function Game2048Page() {
  const [state, dispatch] = use2048();
  const turboEdge = useTurboEdgeV0();
  const peerId = turboEdge?.node.peerId.toString();
  const [ranking, setRanking] = useState<Player[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [{ name: themeName, value: themeValue }] = useTheme("dark");

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        dispatch({
          type: "MOVE",
          payload: "up",
        });
        break;
      case "ArrowDown":
        dispatch({
          type: "MOVE",
          payload: "down",
        });
        break;
      case "ArrowLeft":
        dispatch({
          type: "MOVE",
          payload: "left",
        });
        break;
      case "ArrowRight":
        dispatch({
          type: "MOVE",
          payload: "right",
        });
        break;
      default:
        return;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const sortedScores = Object.entries(state.score) // Convert to array of [playerId, score]
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
    const sortedPlayers: Player[] = sortedScores.map(([name, score]) => ({
      name: state.players[name],
      score,
    }));

    setRanking(sortedPlayers);
  }, [state]);

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
                <div className="items-center">Loading...</div>
              ) : (
                <div className="flex items-center min-h-[calc(100vh-80px)] max-w-[960px] mx-auto">
                  <div className="w-full flex flex-row justify-center -mx-5">
                    <div className="w-1/2 px-5">
                      <div className="max-w-[365px] mx-auto text-3xl">
                        <Game2048
                          key={peerId}
                          className="text-base"
                          grid={state.board[peerId!]}
                          player={state.players[peerId!]}
                          rankingData={ranking}
                          score={state.score[peerId!]}
                        />
                      </div>
                    </div>
                    {state.playersCount > 1 && (
                      <div className="relative flex flex-row flex-wrap w-1/2 px-5 -mx-2.5 gap-y-2 before:bg-white before:content-[''] before:absolute before:left-0 before:top-[10%] before:bottom-[10%] before:w-[1px]">
                        {state.playerId.map(
                          (player) =>
                            player !== peerId && (
                              <div
                                key={`${player}-id`}
                                className="w-1/2 px-2.5 text-xl"
                              >
                                <Game2048
                                  key={player}
                                  className="text-sm"
                                  grid={state.board[player]}
                                  player={state.players[player]}
                                  rankingData={ranking}
                                  score={state.score[player]}
                                />
                              </div>
                            ),
                        )}
                        <div className="w-1/2 px-2.5 text-xl">
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
