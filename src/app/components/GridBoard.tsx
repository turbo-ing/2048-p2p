"use client";

import React, { FC, useRef, useState, useEffect } from "react";
import { MergeEvent, Grid, Tile as TileData } from "@/reducer/2048";
import { Tile } from "./Tile";
import { MergePreview } from "./MergePreview";

/**
 * Number of rows/columns in the board (e.g., 4 for a 4x4 grid)
 */
const NUM_CELLS = 4;

/**
 * Default values
 */
const DEFAULT_GAP = 8;
const DEFAULT_FONT_RATIO = 0.35;

interface GridBoardProps {
  /**
   * 4x4 grid data, where each cell can be either `null` or a `TileData`
   */
  grid: Grid;
  /**
   * Merges that need to be animated (e.g., tile combination events)
   */
  merges: MergeEvent[];
  /**
   * Optional custom className
   */
  className?: string;
}

/**
 * A self-sizing 4x4 "2048" grid board that computes
 * gap, cell size, and font size dynamically based on container width.
 */
export const GridBoard: FC<GridBoardProps> = ({ grid, merges, className }) => {
  const boardRef = useRef<HTMLDivElement>(null);

  // Local state for dynamic sizing
  const [gap, setGap] = useState<number>(DEFAULT_GAP);
  const [cellSize, setCellSize] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(0);

  useEffect(() => {
    if (!boardRef.current) return;

    // A ResizeObserver to recalc gap, cellSize, and fontSize whenever the board resizes
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;

        // Compute GAP
        // 2% of width, but never less than 8
        const computedGap = Math.max(8, width * 0.02);

        // Compute CELL SIZE
        // NUM_CELLS The total gap for each row is (NUM_CELLS - 1).
        // cellSize = (width - totalGapWidth) / NUM_CELLS
        const totalGaps = NUM_CELLS - 1;
        const totalGapWidth = totalGaps * computedGap;
        const computedCellSize = (width - totalGapWidth) / NUM_CELLS;

        // Compute FONT SIZE
        const computedFontSize = Math.min(
          computedCellSize * DEFAULT_FONT_RATIO,
          60,
        );

        // Update state
        setGap(computedGap);
        setCellSize(computedCellSize);
        setFontSize(computedFontSize);
      }
    });

    observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, []);

  // If cellSize is 0, it means we haven't measured yet — show an empty container
  if (!cellSize) {
    return <div ref={boardRef} className={`w-full ${className || ""}`} />;
  }

  return (
    <div
      ref={boardRef}
      className={`aspect-square bg-board rounded-xl bg-[#9C8B7C] border-[#9C8B7C] border-8 ${className || ""}`}
    >
      {/* Underlying 4x4 background squares */}
      <div className="relative w-full aspect-square rounded-md">
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
              className="bg-[#cdc1b4] rounded-md w-full h-full shadow-inner shadow-[hsl(0,0%,54%)] shad"
            />
          ))}
        </div>

        {/* Actual tiles (numbers) + merges */}
        <div className="absolute top-0 left-0 w-full h-full">
          {grid.map((row) =>
            row.map((tile) => {
              if (!tile) return null;
              return (
                <Tile
                  key={tile.id}
                  tile={tile}
                  cellSize={cellSize}
                  gap={gap}
                  fontSize={fontSize}
                />
              );
            }),
          )}
          <MergePreview
            merges={merges}
            cellSize={cellSize}
            gap={gap}
            fonstSize={fontSize}
          />
        </div>
      </div>
    </div>
  );
};
