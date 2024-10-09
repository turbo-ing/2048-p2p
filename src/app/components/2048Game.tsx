"use client";

import React, { useEffect, useState } from "react";

import { Grid, GRID_SIZE } from "@/reducer/2048";
import ScoreBoard from "@/app/components/ScoreBoard";

// Helper function to get background and text color based on tile value
const getTileStyle = (value: number | null) => {
  if (value === null) {
    return { backgroundColor: "#cdc1b4", color: "#776e65" }; // Empty tile
  }
  switch (value) {
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
      if (tile && tile === 2048) {
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
}

const Game2048: React.FC<Game2048Props> = ({ grid, score }) => {
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

  return (
    <div className="flex flex-col justify-center items-center h-full">
      {gameOver && (
        <div className="absolute flex justify-center items-center text-4xl text-white font-bold m-0 w-full h-full z-10 bg-red-700">
          Game Over! No more moves.
        </div>
      )}
      {gameWon && (
        <div className="absolute flex justify-center items-center text-4xl text-white font-bold m-0 w-full h-full z-10 bg-green-700">
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          Congratulations! You've won!
        </div>
      )}
      <div className="mb-6">
        <ScoreBoard title="Score" total={score} />
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="contents">
            {row.map((tile, colIndex) => {
              const { backgroundColor, color } = getTileStyle(tile);

              return (
                <div
                  key={colIndex}
                  className="w-20 h-20 bg-[#cdc1b4] flex items-center justify-center text-3xl rounded-md transition-all duration-300"
                  style={{ backgroundColor, color }}
                >
                  {tile ? tile : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Game2048;
