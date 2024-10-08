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
        await dispatch({ type: "MOVE", payload: "up" });
        break;
      case "ArrowDown":
        await dispatch({ type: "MOVE", payload: "down" });
        break;
      case "ArrowLeft":
        await dispatch({ type: "MOVE", payload: "left" });
        break;
      case "ArrowRight":
        await dispatch({ type: "MOVE", payload: "right" });
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
            <div className="flex flex-col justify-center items-center h-full">
              {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
              <div onKeyDown={handleKeyDown}>
                {state ? (
                  state.players.map((player) => (
                    <div key={player}>
                      <Game2048
                        grid={state.board[player]}
                        score={state.score[player]}
                      />
                    </div>
                  ))
                ) : (
                  <div> Loading...</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </ThemeProvider>
    </div>
  );
}
