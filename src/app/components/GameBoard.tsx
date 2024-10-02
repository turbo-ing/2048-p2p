"use client";

import type { Tile } from "@/app/hooks/useGameBoard";
import type { GameStatus } from "@/app/hooks/useGameState";

import React, { FC, useEffect, useRef, useState } from "react";

import Box from "./Box";
import Grid from "./Grid";
import Notification from "./Notification";
import TileComponent from "./Tile";

import { Vector } from "@/utils/types";
import useSwipe from "@/app/hooks/useSwipe";
import { calcLocation, calcTileSize } from "@/utils/common";
import useArrowKeyPress from "@/app/hooks/useArrowKeyPress";

export interface GameBoardProps {
  tiles?: Tile[];
  gameStatus: GameStatus;
  rows: number;
  cols: number;
  boardSize: number;
  spacing: number;
  onMove: (dir: Vector) => void;
  onMovePending: () => void;
  onMergePending: () => void;
  onCloseNotification: (currentStatus: GameStatus) => void;
}

const GameBoard: FC<GameBoardProps> = ({
  tiles,
  gameStatus,
  rows,
  cols,
  boardSize,
  spacing,
  onMove,
  onMovePending,
  onMergePending,
  onCloseNotification,
}) => {
  const [{ width: tileWidth, height: tileHeight }, setTileSize] = useState(() =>
    calcTileSize(boardSize, rows, cols, spacing),
  );
  const boardRef = useRef<HTMLDivElement>(null);

  useArrowKeyPress(onMove);
  useSwipe(boardRef, onMove);

  useEffect(() => {
    setTileSize(calcTileSize(boardSize, rows, cols, spacing));
  }, [boardSize, cols, rows, spacing]);

  return (
    <Box ref={boardRef} position="relative">
      <Grid
        cols={cols}
        height={boardSize}
        rows={rows}
        spacing={spacing}
        width={boardSize}
      />
      <Box
        background="transparent"
        blockSize="100%"
        inlineSize="100%"
        left={0}
        position="absolute"
        top={0}
        onAnimationEnd={onMergePending}
        onTransitionEnd={onMovePending}
      >
        {tiles?.map(({ r, c, id, value, isMerging, isNew }) => (
          <TileComponent
            key={id}
            height={tileHeight}
            isMerging={isMerging}
            isNew={isNew}
            value={value}
            width={tileWidth}
            x={calcLocation(tileWidth, c, spacing)}
            y={calcLocation(tileHeight, r, spacing)}
          />
        ))}
      </Box>
      {(gameStatus === "win" || gameStatus === "lost") && (
        <Notification
          win={gameStatus === "win"}
          onClose={() => onCloseNotification(gameStatus)}
        />
      )}
    </Box>
  );
};

export default React.memo(GameBoard);
