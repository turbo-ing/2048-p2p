// Types
import { EdgeAction, useEdgeReducerV0 } from "@turbo-ing/edge-v0";

export type Direction = "up" | "down" | "left" | "right";
export type Grid = (number | null)[][];
export type G2048State = {
  board: { [playerId: string]: Grid };
  players: string[];
  playersCount: number;
};

// Constants for grid size and initial tiles
export const GRID_SIZE = 4;
export const INITIAL_TILES = 2;

interface MoveAction extends EdgeAction<G2048State> {
  type: "MOVE";
  payload: Direction;
}

interface JoinAction extends EdgeAction<G2048State> {
  type: "JOIN";
  payload: {
    name: string;
  };
}

interface LeaveAction extends EdgeAction<G2048State> {
  type: "LEAVE";
}

// Action Types
type Action = MoveAction | JoinAction | LeaveAction;

const error = (message: string) => {
  console.error(message);
};

// Helper functions
const getRandomTile = (): number => (Math.random() < 0.9 ? 2 : 4);

const getRandomPosition = (grid: Grid): { x: number; y: number } | null => {
  const emptyPositions: { x: number; y: number }[] = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (!grid[i][j]) emptyPositions.push({ x: i, y: j });
    }
  }
  if (emptyPositions.length === 0) return null;

  return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
};

const getEmptyGrid = (): Grid => {
  const grid: Grid = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    grid.push(new Array(GRID_SIZE).fill(null));
  }

  return grid;
};

// Function to deep clone the grid
const deepCloneGrid = (grid: Grid): Grid => {
  return grid.map((row) => [...row]);
};

const spawnNewTile = (grid: Grid): Grid => {
  const pos = getRandomPosition(grid);

  if (!pos) return grid;
  const newGrid = deepCloneGrid(grid); // Deep clone the grid

  newGrid[pos.x][pos.y] = getRandomTile();

  return newGrid;
};

// Helper to slide tiles in a row (remove nulls, and slide values to the left)
const slide = (row: (number | null)[]): (number | null)[] => {
  const newRow = row.filter((val) => val !== null); // Filter out nulls
  const emptySpaces = GRID_SIZE - newRow.length; // Calculate empty spaces

  return [...newRow, ...new Array(emptySpaces).fill(null)]; // Add empty spaces to the end
};

// Helper to merge tiles in a row (combine adjacent tiles with the same value)
const merge = (row: (number | null)[]): (number | null)[] => {
  const newRow = [...row]; // Copy the row

  for (let i = 0; i < GRID_SIZE - 1; i++) {
    if (newRow[i] !== null && newRow[i] === newRow[i + 1]) {
      newRow[i] = newRow[i]! * 2; // Merge tiles
      newRow[i + 1] = null; // Set the next tile to null after merge
    }
  }

  return newRow;
};

// Function to move and merge a single row or column
const moveAndMergeRow = (row: (number | null)[]): (number | null)[] => {
  const slidRow = slide(row); // First slide to remove empty spaces
  const mergedRow = merge(slidRow); // Then merge adjacent tiles

  return slide(mergedRow); // Slide again to remove any new empty spaces
};

// Transpose the grid (convert columns to rows and vice versa) for vertical movement
const transposeGrid = (grid: Grid): Grid => {
  return grid[0].map((_, colIndex) => grid.map((row) => row[colIndex]));
};

// Function to move the grid based on direction
const moveGrid = (grid: Grid, direction: Direction): Grid => {
  let newGrid: Grid = [];

  if (direction === "left") {
    // Move left: process each row
    newGrid = grid.map((row) => moveAndMergeRow(row));
  } else if (direction === "right") {
    // Move right: reverse each row, process, then reverse again
    newGrid = grid.map((row) => moveAndMergeRow(row.reverse()).reverse());
  } else if (direction === "up") {
    // Move up: transpose, process rows as columns, then transpose back
    const transposed = transposeGrid(grid);
    const movedGrid = transposed.map((row) => moveAndMergeRow(row));

    newGrid = transposeGrid(movedGrid);
  } else if (direction === "down") {
    // Move down: transpose, reverse rows (as columns), process, reverse, then transpose back
    const transposed = transposeGrid(grid);
    const movedGrid = transposed.map((row) =>
      moveAndMergeRow(row.reverse()).reverse(),
    );

    newGrid = transposeGrid(movedGrid);
  }

  return newGrid;
};

const initializeGame = () => {
  let newGrid = getEmptyGrid();

  for (let i = 0; i < INITIAL_TILES; i++) {
    newGrid = spawnNewTile(newGrid);
  }

  return newGrid;
};

const initialState: G2048State = {
  board: { ["local_player"]: initializeGame() },
  players: ["local_player"],
  playersCount: 1,
};

const game2048Reducer = (state: G2048State, action: Action): G2048State => {
  switch (action.type) {
    case "MOVE":
      console.log("Payload on MOVE", action.payload);
      console.log("State on MOVE", state);
      const newGrid = moveGrid(state.board["local_player"], action.payload);

      return {
        ...state,
        board: { ...state.board, ["local_player"]: spawnNewTile(newGrid) },
      };
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

export const use2048 = (roomId: string) => {
  const [state, dispatch, connected] = useEdgeReducerV0(
    game2048Reducer,
    initialState,
    {
      topic: roomId ? `turbo-game2048-${roomId}` : "game2048",
    },
  );

  return { state, dispatch, connected };
};
