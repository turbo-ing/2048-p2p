"use client";

import React, { useEffect, useRef, useState } from "react";
import { Board, Direction, Grid, GRID_SIZE, MergeEvent } from "@/reducer/2048";
import ScoreBoard from "@/app/components/2048ScoreBoard";
import { Player, ResultModal } from "@/app/components/ResultModal";
import { WaitingModal } from "@/app/components/WaitingModal";
import useArrowKeyPress from "@/app/hooks/useArrowKeyPress";
import useSwipe from "@/app/hooks/useSwipe";
import { gridsAreEqual, getGameState, hasValidMoves } from "@/utils/helper";
import { Tile } from "./Tile";
import { MergePreview } from "./MergePreview";
import { BASE_ANIMATION_SPEED } from "../../../tailwind.config";

// --- Constants ---
const NUM_CELLS = 4;
const DEFAULT_GAP = 10;

interface Game2048Props {
  lenQueue: number;
  board: Board;
  score: number;
  player: string;
  trueid: string;
  rankingData: Player[];
  className?: string;
  dispatchDirection: (dir: Direction) => void;
  leave: () => void;
  width: number;
  height: number;
  isFinished: { [playerId: string]: boolean };
}

const Game2048: React.FC<Game2048Props> = ({
  lenQueue,
  board,
  score,
  player,
  trueid,
  rankingData,
  className,
  dispatchDirection,
  leave,
  isFinished,
}) => {
  const { grid, merges } = board;

  const [currentGrid, setCurrentGrid] = useState<Grid>(grid);
  const previousGridRef = useRef<Grid | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [allFinished, setAllFinished] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(0);
  const [gap, setGap] = useState(DEFAULT_GAP);

  const [mergeTiles, setMergeTiles] = useState<MergeEvent[]>([]);

  useEffect(() => {
    /**
     * Check if other players have finished their games.
     */
    let allFin = true;
    for (let f in isFinished) {
      if (isFinished[f] == false) {
        allFin = false;
      }
    }
    if (allFin && !allFinished) {
      setAllFinished(true);
    }
  });

  /**
   * Observe board resize and recalculate `cellSize`.
   */
  useEffect(() => {
    if (!boardRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        const totalGaps = NUM_CELLS - 1;
        const newGap = gap; // Replace with any dynamic logic for gap if desired
        const newCellSize = (width - totalGaps * newGap) / NUM_CELLS;
        setCellSize(newCellSize);
      }
    });

    observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, [gap]);

  /**
   * Updates the grid with prevX/prevY data for animations.
   */
  const updateGrid = (newGrid: Grid) => {
    const previousGrid = previousGridRef.current;

    // If the new grid is the same as the previous grid, do nothing.
    if (previousGrid && gridsAreEqual(newGrid, previousGrid)) return;

    const updatedGrid = newGrid.map((row, y) =>
      row.map((tile, x) => {
        if (!tile) return null;

        let prevX = x;
        let prevY = y;
        let isMoved = false;

        // Find the tile's previous position (if any)
        if (previousGrid) {
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

    previousGridRef.current = newGrid;
    setCurrentGrid(updatedGrid);
  };

  /**
   * Schedule merges for animation, then clear them.
   */
  const handleMerges = (mergeEvents: MergeEvent[]) => {
    if (mergeEvents.length > 0) {
      setMergeTiles(mergeEvents);
      // Remove them after the base animation delay
      setTimeout(() => {
        setMergeTiles([]);
      }, BASE_ANIMATION_SPEED * 1000);
    }
  };

  /**
   * Main effect to handle:
   *  - Checking game state (win/lose).
   *  - Animating merges (if any).
   *  - Updating grid positions.
   */
  useEffect(() => {
    // No grid means nothing to do
    if (!grid || grid.length === 0) return;

    // Check if game is won or lost
    const state = getGameState(grid);
    if (state === "WON") {
      setGameWon(true);
      return;
    }
    if (state === "LOST") {
      setGameOver(true);
      return;
    }

    // If merges exist, animate them
    if (merges && merges.length > 0) {
      handleMerges(merges);
    }

    // Update tile positions for animation
    updateGrid(grid);
  }, [grid, merges]);

  // Hook to control the board with arrow keys
  useArrowKeyPress(dispatchDirection);

  // Hook to control the board with swipes
  useSwipe(dispatchDirection);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto px-4">
      {/* Result Modal */}
      {(gameOver || gameWon) && allFinished && (
        <ResultModal
          leave={leave}
          player={trueid}
          isWinner={gameWon}
          open={true}
          rankingData={rankingData}
          lenQueue={lenQueue}
        />
      )}

      {/* Scoreboard */}
      <div className="flex justify-center mb-6 w-full">
        <ScoreBoard title="Score" total={score} />
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="relative w-full aspect-square bg-boardBackground rounded-md"
      >
        {/* Waiting Modal */}
        {(gameOver || gameWon) && !allFinished && player == trueid && (
          <WaitingModal
            player={player}
            isWinner={gameWon}
            open={!hasValidMoves(grid)}
            rankingData={rankingData}
          />
        )}
        {((!(gameOver || gameWon) && !allFinished) ||
          (gameOver && !allFinished && player != trueid)) && (
          <div className="relative w-full aspect-square bg-boardBackground rounded-md">
            {/* Grid background blocks */}
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
                />
              ))}
            </div>

            {/* Actual tiles + merge preview */}
            <div className="absolute top-0 left-0 w-full h-full">
              {currentGrid.map((row) =>
                row.map((tile) => {
                  if (!tile) return null;
                  return (
                    <Tile
                      key={tile.id}
                      tile={tile}
                      cellSize={cellSize}
                      gap={gap}
                    />
                  );
                }),
              )}
              <MergePreview merges={mergeTiles} cellSize={cellSize} gap={gap} />
            </div>
          </div>
        )}
      </div>

      {/* Player info */}
      {rankingData.length > 1 && (
        <div className="border-b border-white pb-3 mt-6 w-full">
          <p className={`text-center text-white ${className}`}>
            Player: {player}
          </p>
        </div>
      )}
    </div>
  );
};

export default Game2048;
