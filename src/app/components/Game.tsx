// Accidental wrongly implemented 2048Game, should be implentation of 2048Game into responsive Container in play/page.tsx

import React, { useEffect, useRef, useState } from "react";
import ResponsiveContainer from "./ResponsiveContainer";
import ScoreBoard from "@/app/components/2048ScoreBoard";
import { Board, Direction, Grid, GRID_SIZE, MergeEvent } from "@/reducer/2048";
import { getGameState, gridsAreEqual, hasValidMoves } from "@/utils/helper";
import { Player, ResultModal } from "./ResultModal";
import { WaitingModal } from "./WaitingModal";
import { BASE_ANIMATION_SPEED } from "../../../tailwind.config";
import useArrowKeyPress from "../hooks/useArrowKeyPress";
import useSwipe from "../hooks/useSwipe";
import { GridBoard } from "./GridBoard";
import Button from "./Button";

interface GameProps {
  timer: number;
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
  leave: () => void;
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

const Game: React.FC<GameProps> = ({
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
  leave,
  isFinished,
  allFinished,
  setAllFinished,
  surrendered,
  allSurrendered,
  frontSurrendered,
  totalPlayers,
  clock,
}) => {
  const { grid, merges } = board;

  const [currentGrid, setCurrentGrid] = useState<Grid>(grid);
  const previousGridRef = useRef<Grid | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(0);

  const [mergeTiles, setMergeTiles] = useState<MergeEvent[]>([]);

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
    <>
      {/* Dont know "\_,() '-' ),_/"  */}
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

      {/* End of game results modal */}
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
          leave={leave}
          player={trueid}
          isWinner={gameWon}
          open={true}
          rankingData={rankingData}
          lenQueue={lenQueue}
          totalPlayers={totalPlayers}
        />
      )}
      <ResponsiveContainer
        /**
         * Header (top):
         * Place scoreboard here
         */
        top={
          <div className="flex justify-center mb-6 w-full">
            <ScoreBoard title="SCORE" total={score} />
            {timer !== 0 && <ScoreBoard title="Time left:" total={clock} />}
          </div>
        }
        /**
         * Main (middle):
         * 2048 game here (with scoreboard hidden).
         */
        middle={
          <>
            {((!(gameOver || gameWon) && !allFinished) ||
              (gameOver && !allFinished && player !== trueid) ||
              (clock !== 0 && timer !== 0) ||
              timer === 0) && (
              <GridBoard grid={currentGrid} merges={mergeTiles} />
            )}
          </>
        }
        /**
         * Footer (bottom):
         */
        bottom={
          <>
            {/* Player info */}
            {rankingData.length > 1 && (
              <div className="border-b border-text pb-3 mt-6 w-full">
                <p className={`text-center ${className}`}>Player: {player}</p>
              </div>
            )}
            {/* surrender button */}
            {player === trueid && (
              <Button onClick={() => leave()}>
                <p className="">
                  {totalPlayers > 1 && "Surrender"}{" "}
                  {totalPlayers < 2 && "Leave"}
                </p>
              </Button>
            )}
          </>
        }
      />
    </>
  );
};

export default Game;
