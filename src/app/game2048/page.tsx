"use client";

import { ThemeProvider } from "styled-components";
import { useCallback } from "react";

import Game2048Board from "@/app/components/Game2048Board";
import { Navbar } from "@/app/components/Navbar";
import ScoreBoard from "@/app/components/ScoreBoard";
import { GRID_SIZE, MIN_SCALE, SPACING } from "@/utils/constants";
import { Vector } from "@/utils/types";
import { useGame2048 } from "@/reducer/game2048";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import useTheme from "@/app/hooks/useTheme";
import { ThemeName } from "@/app/themes/types";
import useGameScore from "@/app/hooks/useGameScore";

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
  const { state, dispatch, onMovePending, onMergePending } = useGame2048({
    roomId: "game2048",
    rows: 4,
    cols: 4,
    addScore,
  });

  const [{ name: themeName, value: themeValue }] = useTheme(config.theme);

  const onMove = async (dir: Vector) => {
    await dispatch({ type: "MOVE", payload: dir });
  };

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
                <ScoreBoard title="Score" total={total} />
              </div>
              <Game2048Board
                boardSize={GRID_SIZE}
                cols={4}
                gameState={state}
                rows={4}
                spacing={SPACING}
                onMergePending={onMergePending}
                onMove={onMove}
                onMovePending={onMovePending}
              />
            </div>
          </div>
        </main>
      </ThemeProvider>
    </div>
  );
}
