"use client";
import React from "react";

import { Grid, GRID_SIZE } from "@/reducer/2048";

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

// Refactored Game2048 component
interface Game2048Props {
  grid: Grid; // Initial state passed as a prop
}

const Game2048: React.FC<Game2048Props> = ({ grid }) => {
  return (
    <div className="game-container">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="row">
          {row.map((tile, colIndex) => {
            const { backgroundColor, color } = getTileStyle(tile);

            return (
              <div
                key={colIndex}
                className="tile"
                style={{ backgroundColor, color }}
              >
                {tile ? tile : ""}
              </div>
            );
          })}
        </div>
      ))}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        .game-container {
          display: grid;
          grid-template-columns: repeat(${GRID_SIZE}, 100px);
          gap: 10px;
        }
        .row {
          display: contents;
        }
        .tile {
          width: 100px;
          height: 100px;
          background-color: #cdc1b4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          border-radius: 5px;
          transition:
            background-color 0.3s,
            color 0.3s;
        }
      `}</style>
    </div>
  );
};

export default Game2048;
