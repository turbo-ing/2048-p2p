"use client";

import { ThemeProvider } from "styled-components";
import { useEffect } from "react";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";

import { Navbar } from "@/app/components/Navbar";
import useTheme from "@/app/hooks/useTheme";
import Game2048 from "@/app/components/2048Game";
import { use2048 } from "@/reducer/2048";

export default function Game2048Page() {
  const turboEdge = useTurboEdgeV0();
  const peerId = turboEdge?.node.peerId.toString();
  const { state, dispatch, connected } = use2048("game2048", peerId ?? "local");

  console.log("State on Game2048Page", state.board[peerId ?? "local"]);

  const [{ name: themeName, value: themeValue }] = useTheme("dark");

  const handleKeyDown = async (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        await dispatch({
          type: "MOVE",
          payload: { direction: "up", peerId: peerId ?? "" },
        });
        break;
      case "ArrowDown":
        await dispatch({
          type: "MOVE",
          payload: { direction: "down", peerId: peerId ?? "" },
        });
        break;
      case "ArrowLeft":
        await dispatch({
          type: "MOVE",
          payload: { direction: "left", peerId: peerId ?? "" },
        });
        break;
      case "ArrowRight":
        await dispatch({
          type: "MOVE",
          payload: { direction: "right", peerId: peerId ?? "" },
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
            <div className="flex flex-row justify-center items-center">
              {!state ? (
                <div>Loading...</div>
              ) : state.playersCount === 1 ? (
                <div>
                  <Game2048
                    key={peerId}
                    grid={state.board[peerId ?? ""]}
                    score={state.score[peerId ?? ""]}
                  />
                </div>
              ) : (
                <div className="flex flex-row justify-center items-center">
                  <div className="w-1/2 mr-6">
                    <Game2048
                      key={peerId}
                      grid={state.board[peerId ?? ""]}
                      score={state.score[peerId ?? ""]}
                    />
                  </div>
                  <div className="w-1/2 grid grid-cols-2 gap-4">
                    {state.players.map(
                      (player) =>
                        player !== peerId && (
                          <Game2048
                            key={player}
                            grid={state.board[player]}
                            score={state.score[player]}
                          />
                        ),
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
