"use client";

import { ThemeProvider } from "styled-components";
import { useEffect } from "react";

import { Navbar } from "@/app/components/Navbar";
import ScoreBoard from "@/app/components/ScoreBoard";
import { MIN_SCALE } from "@/utils/constants";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import useTheme from "@/app/hooks/useTheme";
import { ThemeName } from "@/app/themes/types";
import useGameScore from "@/app/hooks/useGameScore";
import Game2048 from "@/app/components/2048Game";
import { use2048 } from "@/reducer/2048";

export type Configuration = {
  theme: ThemeName;
  bestScore: number;
  rows: number;
  cols: number;
};

const APP_NAME = "2048-p2p";

export default function Game2048Page() {
  const [config] = useLocalStorage<Configuration>(APP_NAME, {
    theme: "dark",
    bestScore: 0,
    rows: MIN_SCALE,
    cols: MIN_SCALE,
  });
  const { total, best, addScore, setTotal } = useGameScore(config.bestScore);
  const { state, dispatch, connected } = use2048("game2048");

  const [{ name: themeName, value: themeValue }] = useTheme(config.theme);

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
              <div className="mb-6">
                <ScoreBoard title="Score" total={state.score["local_player"]} />
              </div>
              {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
              <div onKeyDown={handleKeyDown}>
                <Game2048 grid={state.board["local_player"]} />
              </div>
            </div>
          </div>
        </main>
      </ThemeProvider>
    </div>
  );
}
