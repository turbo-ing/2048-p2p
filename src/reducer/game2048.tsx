import { useCallback, useState } from "react";
import { EdgeAction, useEdgeReducerV0 } from "@turbo-ing/edge-v0";

import useLazyRef from "@/app/hooks/useLazyRef";
import {
  clamp,
  create2DArray,
  createIndexArray,
  getId,
  nextTileIndex,
  shuffle,
} from "@/utils/common";
import { Cell, Location, Tile } from "@/app/hooks/useGameBoard";
import { Vector } from "@/utils/types";

interface MoveAction extends EdgeAction<Game2048State> {
  type: "MOVE";
  payload: Vector;
}

interface JoinAction extends EdgeAction<Game2048State> {
  type: "JOIN";
  payload: {
    name: string;
  };
}

interface LeaveAction extends EdgeAction<Game2048State> {
  type: "LEAVE";
}

// Action Types
type Action = MoveAction | JoinAction | LeaveAction;

export type Game2048Params = {
  roomId?: string;
  rows: number;
  cols: number;
  addScore: (score: number) => void;
};

export type Game2048Status =
  | "win"
  | "lost"
  | "continue"
  | "restart"
  | "running";

export type Game2048State = {
  status: Game2048Status;
  grid: Cell[][];
  tiles: Tile[];
  pause: boolean;
  pendingStack: number[];
};

const error = (message: string) => {
  console.error(message);
};

const createNewTile = (r: number, c: number): Tile => {
  const index = nextTileIndex();
  const id = getId(index);

  return {
    index,
    id,
    r,
    c,
    isNew: true,
    canMerge: false,
    isMerging: false,
    value: 2,
  };
};

const getEmptyCellsLocation = (grid: Cell[][]) =>
  grid.flatMap((row, r) =>
    row.flatMap<Location>((cell, c) => (cell == null ? { r, c } : [])),
  );

const createNewTilesInEmptyCells = (
  emptyCells: Location[],
  tilesNumber: number,
) => {
  const actualTilesNumber =
    emptyCells.length < tilesNumber ? emptyCells.length : tilesNumber;

  if (!actualTilesNumber) return [];

  return shuffle(emptyCells)
    .slice(0, actualTilesNumber)
    .map(({ r, c }) => createNewTile(r, c));
};

const createInitialTiles = (grid: Cell[][]) => {
  const emptyCells = getEmptyCellsLocation(grid);
  const rows = grid.length;
  const cols = grid[0].length;

  return createNewTilesInEmptyCells(emptyCells, Math.ceil((rows * cols) / 8));
};

const createTraversalMap = (rows: number, cols: number, dir: Vector) => {
  const rowsMap = createIndexArray(rows);
  const colsMap = createIndexArray(cols);

  return {
    // Always start from the last cell in the moving direction
    rows: dir.r > 0 ? rowsMap.reverse() : rowsMap,
    cols: dir.c > 0 ? colsMap.reverse() : colsMap,
  };
};

const moveInDirection = (grid: Cell[][], dir: Vector) => {
  const newGrid = grid.slice(0);
  const totalRows = newGrid.length;
  const totalCols = newGrid[0].length;
  const tiles: Tile[] = [];
  const moveStack: number[] = [];

  const traversal = createTraversalMap(totalRows, totalCols, dir);

  traversal.rows.forEach((row) => {
    traversal.cols.forEach((col) => {
      const tile = newGrid[row][col];

      if (tile != null) {
        const pos = {
          currRow: row,
          currCol: col,
          // clamp to ensure next row and col are still in the grid
          nextRow: clamp(row + dir.r, 0, totalRows - 1),
          nextCol: clamp(col + dir.c, 0, totalCols - 1),
        };

        while (pos.nextRow !== pos.currRow || pos.nextCol !== pos.currCol) {
          const { nextRow, nextCol } = pos;
          const nextTile = newGrid[nextRow][nextCol];

          if (nextTile != null) {
            // Move to the next cell if the tile inside has the same value and not been merged
            if (nextTile.value === tile.value && !nextTile.canMerge) {
              pos.currRow = nextRow;
              pos.currCol = nextCol;
            }
            break;
          }
          // We keep moving to the next cell until the cell contains a tile
          pos.currRow = nextRow;
          pos.currCol = nextCol;
          pos.nextRow = clamp(nextRow + dir.r, 0, totalRows - 1);
          pos.nextCol = clamp(nextCol + dir.c, 0, totalCols - 1);
        }

        const { currRow, currCol } = pos;
        const currentTile = newGrid[currRow][currCol];

        // If the tile has been moved
        if (currRow !== row || currCol !== col) {
          const updatedTile = {
            ...tile,
            r: currRow,
            c: currCol,
            canMerge: tile.value === currentTile?.value,
            isNew: false,
            isMerging: false,
          };

          newGrid[currRow][currCol] = updatedTile;
          newGrid[row][col] = undefined;
          tiles.push(updatedTile);
          moveStack.push(updatedTile.index);
        } else if (currentTile != null) {
          tiles.push({ ...currentTile, isNew: false, isMerging: false });
        }
      }
    });
  });

  return {
    tiles,
    grid: newGrid,
    moveStack,
  };
};

const sortTiles = (tiles: Tile[]) =>
  [...tiles].sort((t1, t2) => t1.index - t2.index);

const mergeAndCreateNewTiles = (grid: Cell[][]) => {
  const tiles: Tile[] = [];
  let score = 0;
  const rows = grid.length;
  const cols = grid[0].length;

  const newGrid = grid.map((row) =>
    row.map((tile) => {
      if (tile != null) {
        const { canMerge, value, index, ...rest } = tile;
        const newValue = canMerge ? 2 * value : value;
        const mergedTile = {
          ...rest,
          index,
          value: newValue,
          isMerging: canMerge,
          canMerge: false,
          isNew: false,
        };

        tiles.push(mergedTile);

        if (canMerge) {
          score += newValue;
        }

        return mergedTile;
      }

      return tile;
    }),
  );

  const emptyCells = getEmptyCellsLocation(newGrid);
  const newTiles = createNewTilesInEmptyCells(
    emptyCells,
    Math.ceil((rows * cols) / 16),
  );

  newTiles.forEach((tile) => {
    newGrid[tile.r][tile.c] = tile;
    tiles.push(tile);
  });

  return {
    grid: newGrid,
    tiles,
    score,
  };
};

const game2048Reducer = (
  state: Game2048State,
  action: Action,
): Game2048State => {
  switch (action.type) {
    case "MOVE":
      console.log("Payload on MOVE", action.payload);
      console.log("State on MOVE", state);
      if (state.pendingStack.length === 0) {
        const {
          tiles: newTiles,
          moveStack,
          grid,
        } = moveInDirection(state.grid, action.payload);
        let updateTiles = newTiles;

        // No need to update when no tile moves
        if (moveStack.length > 0) {
          updateTiles = sortTiles(newTiles);
        }

        return {
          ...state,
          grid,
          tiles: updateTiles,
          pendingStack: moveStack,
        };
      }

      return state;
    case "JOIN":
      error("Not implemented yet");

      return state;
    case "LEAVE":
      error("Not implemented yet");

      return state;
    default:
      return state;
  }
};

// Custom Hook
export const useGame2048 = ({
  roomId,
  rows,
  cols,
  addScore,
}: Game2048Params) => {
  const gridMapRef = useLazyRef(() => {
    const grid = create2DArray<Cell>(rows, cols);
    const tiles = createInitialTiles(grid);

    tiles.forEach((tile) => {
      grid[tile.r][tile.c] = tile;
    });

    return { grid, tiles };
  });
  const [tiles, setTiles] = useState<Tile[]>(gridMapRef.current.tiles);

  const initialState: Game2048State = {
    status: "running",
    grid: gridMapRef.current.grid,
    tiles: gridMapRef.current.tiles,
    pause: false,
    pendingStack: [],
  };

  const [state, dispatch, connected] = useEdgeReducerV0(
    game2048Reducer,
    initialState,
    {
      topic: roomId ? `turbo-game2048-${roomId}` : "game2048",
    },
  );

  const onMovePending = useCallback(() => {
    console.log("state on MovePending", state);
    state.pendingStack.pop();
    console.log("state.pendingStack.length 2", state.pendingStack.length);
    if (state.pendingStack.length === 0) {
      const {
        tiles: newTiles,
        score,
        grid,
      } = mergeAndCreateNewTiles(state.grid);

      state.grid = grid;
      state.tiles = newTiles;
      addScore(score);
      state.pendingStack = newTiles
        .filter((tile) => tile.isMerging || tile.isNew)
        .map((tile) => tile.index);
      setTiles(sortTiles(newTiles));
    }
  }, [state]);

  const onMergePending = useCallback(() => {
    console.log("state on onMergePending", state);
    state.pendingStack.pop();
  }, [state]);

  return { state, dispatch, connected, onMovePending, onMergePending };
};
