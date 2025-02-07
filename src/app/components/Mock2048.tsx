import { useState, useEffect, useRef, useCallback } from "react";
import {
  Grid,
  MergeEvent,
  GRID_SIZE,
  moveGrid,
  Direction,
  Tile,
} from "@/reducer/2048";
import { GridBoard } from "./GridBoard";
import { gridsAreEqual } from "@/utils/helper";

// Utility function to generate an empty grid
const createEmptyGrid = (): Grid => {
  const tile1: Tile = {
    id: crypto.randomUUID(),
    value: 2,
    isNew: true,
    isMerging: false,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
  };
  const tile2: Tile = {
    id: crypto.randomUUID(),
    value: 2,
    isNew: true,
    isMerging: false,
    x: 3,
    y: 3,
    prevX: 3,
    prevY: 3,
  };

  return [
    [tile1, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, tile2],
  ];
};

const useGrid = () => {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [merges, setMerges] = useState<MergeEvent[]>([]);
  const previousGridRef = useRef<Grid | null>(null);

  useEffect(() => {
    setGrid(createEmptyGrid()); // Initialize the grid
  }, []);

  const updateGrid = useCallback((newGrid: Grid) => {
    const previousGrid = previousGridRef.current;
    if (previousGrid && gridsAreEqual(newGrid, previousGrid)) return;

    const updatedGrid = newGrid.map((row, y) =>
      row.map((tile, x) => {
        if (!tile) return null;

        let prevX = x;
        let prevY = y;
        let isMoved = false;

        if (previousGrid) {
          for (let py = 0; py < GRID_SIZE; py++) {
            for (let px = 0; px < GRID_SIZE; px++) {
              const prevTile = previousGrid[py][px];
              if (prevTile && prevTile.id === tile.id) {
                prevX = px;
                prevY = py;
                if (prevX !== x || prevY !== y) isMoved = true;
                break;
              }
            }
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
    setGrid(updatedGrid);
  }, []);

  const addRandomTiles = useCallback(
    (amount: number) => {
      if (!grid) return;

      const emptyCells: { x: number; y: number }[] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (grid[y][x] === null) {
            emptyCells.push({ x, y });
          }
        }
      }

      if (emptyCells.length === 0) return;

      const newGrid = grid.map((row) => [...row]);

      for (let i = 0; i < amount && emptyCells.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const { x, y } = emptyCells[randomIndex];
        newGrid[y][x] = {
          id: crypto.randomUUID(),
          value: Math.random() < 0.8 ? 2 : 4,
          isNew: true,
          isMerging: false,
          x,
          y,
          prevX: x,
          prevY: y,
        };
        emptyCells.splice(randomIndex, 1);
      }

      setGrid(newGrid);
    },
    [grid],
  );

  return { grid, merges, updateGrid, addRandomTiles, setMerges };
};

export default function Mock2048() {
  const { grid, merges, updateGrid, addRandomTiles, setMerges } = useGrid();

  useEffect(() => {
    const directions: Direction[] = ["up", "down", "left", "right"];
    const intervalDuration = 800;

    const interval = setInterval(() => {
      if (!grid) return;

      const randomDirection =
        directions[Math.floor(Math.random() * directions.length)];
      const { merges: mergeEvents, newGrid } = moveGrid(grid, randomDirection);

      if (!gridsAreEqual(newGrid, grid)) {
        updateGrid(newGrid);
        setMerges(mergeEvents);
        if (Math.random() < 0.2) {
          addRandomTiles(1);
        }
      }
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [grid, updateGrid, addRandomTiles, setMerges]);

  return (
    <div className="transition-all">
      {grid && (
        <GridBoard
          grid={grid}
          merges={merges}
          className="animate-fadeIn select-none"
        />
      )}
    </div>
  );
}
