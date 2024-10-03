"use client";

import type { GameState } from "@/app/hooks/useGameState";

import React, { FC, useRef, useState } from "react";

import { Vector } from "@/utils/types";
import Grid from "@/app/components/Grid/Grid";
import Box from "@/app/components/Box/StyledBox";
import TileComponent from "@/app/components/Tile/Tile";
import { calcLocation, calcTileSize } from "@/utils/common";
import useArrowKeyPress from "@/app/hooks/useArrowKeyPress";

export interface Game2048BoardProps {
  gameState: GameState;
  rows: number;
  cols: number;
  boardSize: number;
  spacing: number;
  onMove: (dir: Vector) => void;
  onMovePending: () => void;
  onMergePending: () => void;
}

const Game2048Board: FC<Game2048BoardProps> = ({
  gameState,
  rows,
  cols,
  boardSize,
  spacing,
  onMove,
  onMovePending,
  onMergePending,
}) => {
  const [{ width: tileWidth, height: tileHeight }, setTileSize] = useState(() =>
    calcTileSize(boardSize, rows, cols, spacing),
  );
  const boardRef = useRef<HTMLDivElement>(null);

  useArrowKeyPress(onMove);

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
        {gameState.tiles?.map(({ r, c, id, value, isMerging, isNew }) => (
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
      {/*{(gameStatus === "win" || gameStatus === "lost") && (*/}
      {/*  <Notification*/}
      {/*    win={gameStatus === "win"}*/}
      {/*    onClose={() => onCloseNotification(gameStatus)}*/}
      {/*  />*/}
      {/*)}*/}
    </Box>
  );
};

export default React.memo(Game2048Board);
