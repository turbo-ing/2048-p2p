"use client";

import React, { useEffect, useState } from "react";

import { Direction, Grid, GRID_SIZE, Tile } from "@/reducer/2048";
import ScoreBoard from "@/app/components/2048ScoreBoard";
import { Player, ResultModal } from "@/app/components/ResultModal";
import useArrowKeyPress from "@/app/hooks/useArrowKeyPress";
import useSwipe from "@/app/hooks/useSwipe";

// Helper function to get background and text color based on tile value
const getTileStyle = (tile: Tile | null) => {
  if (tile === null) {
    return { backgroundColor: "#cdc1b4", color: "#776e65" }; // Empty tile
  }
  switch (tile.value) {
    case 2:
      return { backgroundColor: "#eee4da", color: "#776e65" };
    case 4:
      return { backgroundColor: "#ede0c8", color: "#776e65" };
    case 8:
      return { backgroundColor: "#f2b179", color: "#f9f6f2" };
    case 16:
      return { backgroundColor: "#f59563", color: "#f9f6f2" };
    case 32:
      return { backgroundColor: "#f67c5f", color: "#f9f6f2" };
    case 64:
      return { backgroundColor: "#f65e3b", color: "#f9f6f2" };
    case 128:
      return { backgroundColor: "#edcf72", color: "#f9f6f2" };
    case 256:
      return { backgroundColor: "#edcc61", color: "#f9f6f2" };
    case 512:
      return { backgroundColor: "#edc850", color: "#f9f6f2" };
    case 1024:
      return { backgroundColor: "#edc53f", color: "#f9f6f2" };
    case 2048:
      return { backgroundColor: "#edc22e", color: "#f9f6f2" };
    default:
      return { backgroundColor: "#3c3a32", color: "#f9f6f2" }; // For values above 2048
  }
};

const hasWon = (grid: Grid): boolean => {
  for (let row of grid) {
    for (let tile of row) {
      if (tile && tile.value === 2048) {
        return true;
      }
    }
  }

  return false;
};

// **New helper function** to check if there are any valid moves left
const hasValidMoves = (grid: Grid): boolean => {
  // Check if there's any empty tile
  for (let row of grid) {
    for (let tile of row) {
      if (tile === null) {
        return true;
      }
    }
  }

  // Check if adjacent tiles have the same value (horizontal and vertical)
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE - 1; j++) {
      if (
        (grid[i][j] && grid[i][j + 1] && grid[i][j]! === grid[i][j + 1]!) || // Horizontal
        (grid[j][i] && grid[j + 1][i] && grid[j][i]! === grid[j + 1][i]!) // Vertical
      ) {
        return true;
      }
    }
  }

  return false; // No valid moves left
};

// Refactored Game2048 component
interface Game2048Props {
  grid: Grid; // Initial state passed as a prop
  score: number; // Score passed as a prop
  player: string;
  rankingData: Player[];
  className?: string; // Optional className prop
  dispatchDirection: (dir: Direction) => void; // Dispatch function to handle direction
}

const Game2048: React.FC<Game2048Props> = ({
  grid,
  score,
  player,
  rankingData,
  className,
  dispatchDirection,
}) => {
  const [gameOver, setGameOver] = useState<boolean>(false); // Track if the game is over
  const [gameWon, setGameWon] = useState<boolean>(false); // Track if the player won

  useEffect(() => {
    // Check if the player has won
    if (hasWon(grid)) {
      setGameWon(true);
    }
    // Check if there are no valid moves left (game over)
    else if (!hasValidMoves(grid)) {
      setGameOver(true);
    }
  }, [grid]);

  useArrowKeyPress(dispatchDirection);
  useSwipe(dispatchDirection);

  const baseStyles = "text-center mt-6 text-white";

  return (
    <div>
      {gameOver && (
        <ResultModal isWinner={false} open={true} rankingData={rankingData} />
      )}
      {gameWon && (
        <ResultModal isWinner={true} open={true} rankingData={rankingData} />
      )}
      <div className="flex justify-center mb-6">
        <ScoreBoard title="Score" total={score} />
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {grid &&
          grid.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {row.map((tile, colIndex) => {
                const { backgroundColor, color } = getTileStyle(tile);
                const isMerged = tile && tile.isMerging;
                const isNew = tile && tile.isNew;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`pt-[100%] relative bg-[#cdc1b4] flex items-center justify-center rounded-md transition-transform duration-300 ${isNew ? "animate-newTileAppear" : ""} ${isMerged ? "animate-mergeTile" : ""}`}
                    style={{ backgroundColor, color }}
                  >
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      {tile ? tile.value : ""}
                    </span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
      </div>
      <div className="border-b-1 border-white pb-3">
        <p className={`${baseStyles} ${className}`}>Player: {player}</p>
      </div>
    </div>
  );
};

export default Game2048;
