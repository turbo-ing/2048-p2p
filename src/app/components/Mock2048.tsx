import { useState, useEffect, useRef } from "react";
import {
  Grid,
  getEmptyGrid,
  MergeEvent,
  GRID_SIZE,
  moveGrid,
  Direction,
} from "@/reducer/2048";
import { GridBoard } from "./GridBoard";
import { gridsAreEqual } from "@/utils/helper";
import { BASE_ANIMATION_SPEED } from "../../../tailwind.config";

export default function Mock2048() {
  const [grid, setGrid] = useState<Grid>(getEmptyGrid());
  const [merges, setMerges] = useState<MergeEvent[]>([]);
  const [start, setStart] = useState<boolean>(false);

  const previousGridRef = useRef<Grid | null>(null);

  /**
   * On component mount, add 2 random tiles and mark game as started.
   */
  useEffect(() => {
    addRandomTiles(2);
    setStart(true);
  }, []);

  /**
   * Update the grid so that each tile knows its old position (prevX, prevY)
   * and whether it’s moved or merged (isMoving, isMerging). This helps animate.
   */
  const updateGrid = (newGrid: Grid) => {
    const previousGrid = previousGridRef.current;

    // If the new grid is the same as the previous grid, do nothing.
    if (previousGrid && gridsAreEqual(newGrid, previousGrid)) return;

    // Create an updated grid with tile movement info
    const updatedGrid = newGrid.map((row, y) =>
      row.map((tile, x) => {
        if (!tile) return null;

        let prevX = x;
        let prevY = y;
        let isMoved = false;

        // Find the tile's previous position
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

        // Check if this tile is part of a merge event so we can animate “merge”
        // Depending on how your MergeEvent is structured, adapt the check accordingly.

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
  };

  /**
   * Schedule merges for animation, then clear them after a timeout.
   */
  const handleMerges = (mergeEvents: MergeEvent[]) => {
    if (mergeEvents.length > 0) {
      setMerges(mergeEvents);
      // Remove them after the base animation delay
      // Ensure BASE_ANIMATION_SPEED is a positive number
      setTimeout(
        () => {
          setMerges([]);
        },
        (BASE_ANIMATION_SPEED || 0.2) * 1000,
      );
    }
  };

  /**
   * Whenever grid or merges changes, handle merges and update tile positions.
   */
  useEffect(() => {
    if (!grid || grid.length === 0) return;
    if (merges && merges.length > 0) {
      handleMerges(merges);
    }
    updateGrid(grid);
  }, [grid, merges]);

  /**
   * Add a given number of random tiles to the board.
   * If the board is “full”, we optionally check if no moves are possible
   * and then reset.
   */
  const addRandomTiles = (amount: number) => {
    // Gather all empty cells
    const emptyCells: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x] === null) {
          emptyCells.push({ x, y });
        }
      }
    }

    // If no empty cells, check if any moves or merges are possible
    if (emptyCells.length === 0) {
      // A naive check: try all directions to see if a move would change the grid
      const directions: Direction[] = ["up", "down", "left", "right"];
      const canMove = directions.some((dir) => {
        const { newGrid } = moveGrid(grid, dir);
        return !gridsAreEqual(newGrid, grid);
      });

      // If truly no moves, reset. Otherwise do nothing yet.
      if (!canMove) {
        setGrid(getEmptyGrid());
        setTimeout(() => addRandomTiles(2), 0);
      }
      return;
    }

    // Make a shallow copy of each row so React detects the change
    const newGrid = grid.map((row) => [...row]);

    // Place the requested number of new tiles
    for (let i = 0; i < amount && emptyCells.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const { x, y } = emptyCells[randomIndex];

      // Create a new tile (80% chance of 2, 20% chance of 4)
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

      // Remove used cell
      emptyCells.splice(randomIndex, 1);
    }

    setGrid(newGrid);
  };

  /**
   * Randomly move the grid in an interval between 500ms–1500ms, so we can see animations.
   */
  useEffect(() => {
    const directions: Direction[] = ["up", "down", "left", "right"];
    const intervalDuration = 800;

    const interval = setInterval(() => {
      const randomDirection =
        directions[Math.floor(Math.random() * directions.length)];

      const { merges: mergeEvents, newGrid } = moveGrid(grid, randomDirection);

      // Update only if the move actually changed the grid
      if (!gridsAreEqual(newGrid, grid)) {
        setGrid(newGrid);
        setMerges(mergeEvents);
        // 20% chance to add a new tile
        if (Math.random() < 0.2) {
          addRandomTiles(1);
        }
      }
    }, intervalDuration);

    return () => clearInterval(interval);
    // Re-run if 'start' changes
  }, [start, grid]);

  return <GridBoard grid={grid} merges={merges} />;
}
