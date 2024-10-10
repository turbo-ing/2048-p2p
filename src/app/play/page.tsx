"use client";

import { ThemeProvider } from "styled-components";
import { useEffect } from "react";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";

import { Navbar } from "@/app/components/Navbar";
import useTheme from "@/app/hooks/useTheme";
import Game2048 from "@/app/components/2048Game";
import { use2048 } from "@/reducer/2048";

export default function Game2048Page() {
  const [state, dispatch, connected] = use2048();
  const turboEdge = useTurboEdgeV0();
  const peerId = turboEdge?.node.peerId.toString();

  console.log("connected", connected);
  console.log("peerId", peerId);
  console.log("state", state);

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
                <div className="max-w-[960px] mx-auto">
                  <div className="flex flex-row justify-center -mx-5">
                    <div className="w-1/2 px-5">
                      <div className="max-w-[365px] mx-auto text-3xl">
                        <Game2048
                          key={peerId}
                          className="text-base"
                          grid={state.board[peerId ?? ""]}
                          player={state.players[peerId ?? ""]}
                          score={state.score[peerId ?? ""]}
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
                                  score={state.score[player]}
                                />
                              </div>
                            ),
                        )}
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
