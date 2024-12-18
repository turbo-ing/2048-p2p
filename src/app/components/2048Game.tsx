"use client";

import React, { useEffect, useRef, useState } from "react";
import { Direction, Grid, GRID_SIZE, Tile as TileType } from "@/reducer/2048";
import ScoreBoard from "@/app/components/2048ScoreBoard";
import { Player, ResultModal } from "@/app/components/ResultModal";
import useArrowKeyPress from "@/app/hooks/useArrowKeyPress";
import useSwipe from "@/app/hooks/useSwipe";
import { gridsAreEqual } from "@/utils/helper";
import { Tile } from "./Tile";

// --- Constants ---
const NUM_CELLS = 4;
const DEFAULT_GAP = 10;

function hasWon(grid: Grid): boolean {
  for (const row of grid) {
    for (const tile of row) {
      if (tile?.value === 2048) {
        return true;
      }
    }
  }
  return false;
}

function hasValidMoves(grid: Grid): boolean {
  // Check for empty spaces
  for (const row of grid) {
    for (const tile of row) {
      if (tile === null) return true;
    }
  }

  // Check for adjacent equal tiles horizontally or vertically
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE - 1; j++) {
      const current = grid[i][j];
      const right = grid[i][j + 1];
      const down = grid[j + 1]?.[i];
      const below = grid[j]?.[i];

      if (
        (current && right && current.value === right.value) ||
        (below && down && below.value === down.value)
      ) {
        return true;
      }
    }
  }
  return false;
}

interface Game2048Props {
  grid: Grid;
  score: number;
  player: string;
  rankingData: Player[];
  className?: string;
  dispatchDirection: (dir: Direction) => void;
  width: number;
  height: number;
}

const Game2048: React.FC<Game2048Props> = ({
  grid,
  score,
  player,
  rankingData,
  className,
  dispatchDirection,
}) => {
  const [currentGrid, setCurrentGrid] = useState<Grid>(grid);
  const previousGridRef = useRef<Grid | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState<number>(0);
  const [cellSize, setCellSize] = useState<number>(0);
  const [gap, setGap] = useState<number>(DEFAULT_GAP);

  useEffect(() => {
    if (!boardRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        const totalGaps = NUM_CELLS - 1;
        const newGap = gap; // could be dynamic if desired
        const newCellSize = (width - totalGaps * newGap) / NUM_CELLS;

        setBoardSize(width);
        setCellSize(newCellSize);
      }
    });

    observer.observe(boardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [gap]);

  const updateGrid = (newGrid: Grid) => {
    const previousGrid = previousGridRef.current;

    // Build updatedGrid with prevX, prevY set
    const updatedGrid = newGrid.map((row, y) =>
      row.map((tile, x) => {
        if (!tile) return null;

        let prevX = x;
        let prevY = y;
        let isMoved = false;

        if (previousGrid) {
          // Find the tile in the previous grid
          let foundPrevTile = false;
          for (let py = 0; py < GRID_SIZE; py++) {
            for (let px = 0; px < GRID_SIZE; px++) {
              const prevTile = previousGrid[py][px];
              if (prevTile && prevTile.id === tile.id) {
                prevX = px;
                prevY = py;
                foundPrevTile = true;
                if (prevX !== x || prevY !== y) {
                  isMoved = true;
                }
                break;
              }
            }
            if (foundPrevTile) break;
          }
        } else {
          // Initial load: set prevX/prevY to current position
          prevX = x;
          prevY = y;
        }

        return {
          ...tile,
          prevX,
          prevY,
          x,
          y,
          isMoving: isMoved,
        };
      }),
    );

    if (previousGrid && gridsAreEqual(newGrid, previousGrid)) {
      return;
    }

    previousGridRef.current = newGrid;
    setCurrentGrid(updatedGrid);
  };

  useEffect(() => {
    // On initial mount, ensure tiles have their initial prevX and prevY set
    if (grid && grid.length > 0 && !previousGridRef.current) {
      updateGrid(grid);
    }
  }, [grid]);

  useEffect(() => {
    if (!grid || grid.length === 0) return;

    if (hasWon(grid)) {
      setGameWon(true);
      return;
    }

    if (!hasValidMoves(grid)) {
      setGameOver(true);
      return;
    }

    // If this isn't the initial setup, update grid positions
    if (previousGridRef.current) {
      updateGrid(grid);
    }
  }, [grid]);

  // Input Hooks
  useArrowKeyPress(dispatchDirection);
  useSwipe(dispatchDirection);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto px-4">
      {(gameOver || gameWon) && (
        <ResultModal isWinner={gameWon} open={true} rankingData={rankingData} />
      )}

      <div className="flex justify-center mb-6 w-full">
        <ScoreBoard title="Score" total={score} />
      </div>

      <div
        ref={boardRef}
        className="relative w-full aspect-square bg-boardBackground rounded-md"
      >
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${NUM_CELLS}, 1fr)`,
            gridTemplateRows: `repeat(${NUM_CELLS}, 1fr)`,
            gap: `${gap}px`,
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: NUM_CELLS * NUM_CELLS }, (_, i) => (
            <div
              key={i}
              className="bg-[#cdc1b4] rounded-md w-full h-full"
            ></div>
          ))}
        </div>

        <div className="absolute top-0 left-0 w-full h-full">
          {currentGrid.map((row) =>
            row.map((tile) => {
              if (!tile) return null;
              return (
                <Tile key={tile.id} tile={tile} cellSize={cellSize} gap={gap} />
              );
            }),
          )}
        </div>
      </div>

      <div className="border-b border-white pb-3 mt-6 w-full">
        <p className={`text-center text-white ${className}`}>
          Player: {player}
        </p>
      </div>
    </div>
  );
};

export default Game2048;
