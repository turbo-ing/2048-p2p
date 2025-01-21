"use client";

import React, { useEffect, useRef, useState } from "react";
import { Board, Direction, Grid, GRID_SIZE, MergeEvent } from "@/reducer/2048";
import ScoreBoard from "@/app/components/2048ScoreBoard";
import { Player, ResultModal } from "@/app/components/ResultModal";
import { WaitingModal } from "@/app/components/WaitingModal";
import useArrowKeyPress from "@/app/hooks/useArrowKeyPress";
import useSwipe from "@/app/hooks/useSwipe";
import { gridsAreEqual, getGameState, hasValidMoves } from "@/utils/helper";
import { BASE_ANIMATION_SPEED } from "../../../tailwind.config";
import { GridBoard } from "./GridBoard";
import ExitButton from "./ExitButton";
import Modal from "./Modal";
import Button from "./Button";

// --- Constants ---
const NUM_CELLS = 4;
const DEFAULT_GAP = 8;

interface Game2048Props {
  timer?: number;
  rematch: () => void;
  rem: number;
  remProcessing: boolean;
  downloadProof: () => void;
  lenQueue: number;
  board: Board;
  score: number;
  player: string;
  trueid: string;
  rankingData: Player[];
  className?: string;
  dispatchDirection: (dir: Direction) => void;
  width: number;
  height: number;
  isFinished: { [playerId: string]: boolean };
  allFinished: boolean;
  setAllFinished: (bool: boolean) => void;
  surrendered: { [playerId: string]: boolean };
  frontSurrendered: { [name: string]: boolean };
  allSurrendered: boolean;
  totalPlayers: number;
  clock: number;
}

const Game2048: React.FC<Game2048Props> = ({
  timer,
  rematch,
  rem,
  remProcessing,
  downloadProof,
  lenQueue,
  board,
  score,
  player,
  trueid,
  rankingData,
  className,
  dispatchDirection,
  isFinished,
  allFinished,
  setAllFinished,
  surrendered,
  allSurrendered,
  frontSurrendered,
  totalPlayers,
  clock,
}) => {
  const { grid, merges } = board || { grid: [], merges: [] };

  const [currentGrid, setCurrentGrid] = useState<Grid>(grid);
  const previousGridRef = useRef<Grid | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const [mergeTiles, setMergeTiles] = useState<MergeEvent[]>([]);

  const [exitModalOpen, setExitModalOpen] = useState<boolean>(false);

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
      {(((gameOver || gameWon) && allFinished) ||
        allSurrendered ||
        (clock === 0 && timer !== 0 && allFinished)) && (
        //|| allFinished
        //(gameOver || gameWon) && allFinished && (
        //if the games over and all finished, or if all opponents have surrendered

        <ResultModal
          remProcessing={remProcessing}
          rematch={rematch}
          rem={rem}
          downloadProof={downloadProof}
          surrendered={surrendered}
          allSurrendered={allSurrendered}
          frontSurrendered={frontSurrendered}
          player={trueid}
          isWinner={gameWon}
          open={true}
          rankingData={rankingData}
          lenQueue={lenQueue}
          totalPlayers={totalPlayers}
        />
      )}

      {/* Scoreboard */}
      <div className="flex justify-evenly mb-6 w-full">
        <ScoreBoard title="SCORE" total={score} />
        {timer !== 0 && <ScoreBoard title="TIMER" total={clock} />}
      </div>

      {/* Board */}
      <div className="relative w-full aspect-square bg-board">
        {/* Waiting Modal */}
        {(gameOver || gameWon) &&
          !allFinished &&
          !allSurrendered &&
          player == trueid && (
            <WaitingModal
              player={player}
              isWinner={gameWon}
              open={!hasValidMoves(grid)}
              rankingData={rankingData}
            />
          )}
        {((!(gameOver || gameWon) && !allFinished) ||
          (gameOver && !allFinished && player !== trueid) ||
          (clock !== 0 && timer !== 0) ||
          timer === 0) && (
          <>
            <GridBoard grid={currentGrid} merges={mergeTiles} />
          </>
        )}
      </div>

      {/* Player info */}
      {rankingData.length > 1 && (
        <div className="border-b border-text pb-3 mt-6 w-full">
          <p className={`text-center ${className}`}>Player: {player}</p>
        </div>
      )}
      {/* surrender button */}
      {/* {player === trueid && (
        <Button className="mt-6 text-base" onClick={() => leave()}>
          <p>
            {totalPlayers > 1 && "Surrender"} {totalPlayers < 2 && "Leave"}
          </p>
        </Button>
      )} */}
    </div>
  );
};

export default Game2048;
