import { EdgeAction, useEdgeReducerV0 } from "@turbo-ing/edge-v0";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { keccak256, toHex } from "viem";

export type Direction = "up" | "down" | "left" | "right";

export interface Tile {
  value: number;
  isNew: boolean;
  isMerging: boolean;
}

export type Grid = (Tile | null)[][];
export type Game2048State = {
  board: { [playerId: string]: Grid };
  score: { [playerId: string]: number };
  playerId: string[];
  players: { [playerId: string]: string };
  playersCount: number;
  totalPlayers: number;
};

// Constants for grid size and initial tiles
export const GRID_SIZE = 4;
export const INITIAL_TILES = 2;

interface MoveAction extends EdgeAction<Game2048State> {
  type: "MOVE";
  payload: Direction;
}

interface JoinAction extends EdgeAction<Game2048State> {
  type: "JOIN";
  payload: {
    name: string;
    grid: Grid;
    numPlayers: number;
  };
}

interface LeaveAction extends EdgeAction<Game2048State> {
  type: "LEAVE";
}

// Action Types
type Action = MoveAction | JoinAction | LeaveAction;

const error = (message: string) => {
  console.error(message);
};

// Helper function to check if two grids are the same
const gridsAreEqual = (grid1: Grid, grid2: Grid): boolean => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid1[i][j]?.value !== grid2[i][j]?.value) {
        return false;
      }
    }
  }

  return true;
};

const seedRandom = (seed: number): (() => number) => {
  let currentSeed = seed;

  return () => {
    const x = Math.sin(currentSeed++) * 10000;

    return x - Math.floor(x);
  };
};

// Function to hash the grid into a seed
const keccakToSeedFromGrid = (grid: Grid): number => {
  // Serialize the grid to a JSON string
  const gridString = JSON.stringify(grid);

  // Hash the JSON string using keccak256 and get the hexadecimal representation
  const hash = keccak256(toHex(gridString));

  // Convert a portion of the hash into a number (e.g., first 8 characters of the hex string)
  return parseInt(hash.slice(0, 8), 16);
};

// Helper functions
// const getNewTile = (): number => (Math.random() < 0.9 ? 2 : 4);
const getNewTile = (): Tile => ({
  value: 2,
  isNew: true,
  isMerging: false,
});

const getRandomPosition = (grid: Grid): { x: number; y: number } | null => {
  const emptyPositions: { x: number; y: number }[] = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (!grid[i][j]) emptyPositions.push({ x: i, y: j });
    }
  }
  if (emptyPositions.length === 0) return null;

  // Generate a numeric seed based on the current state of the grid
  const seed = keccakToSeedFromGrid(grid);

  // Create the seeded random generator
  const random = seedRandom(seed);

  // Get a random index based on the seed
  const randomIndex = Math.floor(random() * emptyPositions.length);

  // Return the randomly selected position
  return emptyPositions[randomIndex];
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

  newGrid[pos.x][pos.y] = getNewTile();

  return newGrid;
};

// Helper to slide tiles in a row (remove nulls, and slide values to the left)
const slide = (row: (Tile | null)[]): (Tile | null)[] => {
  const newRow = row.filter((val) => val !== null); // Filter out nulls
  const emptySpaces = GRID_SIZE - newRow.length; // Calculate empty spaces

  return [...newRow, ...new Array(emptySpaces).fill(null)]; // Add empty spaces to the end
};

// Helper to merge tiles in a row (combine adjacent tiles with the same value)
const merge = (
  row: (Tile | null)[],
): { newRow: (Tile | null)[]; score: number } => {
  let score = 0;
  const newRow = [...row]; // Copy the row

  for (let i = 0; i < GRID_SIZE - 1; i++) {
    if (
      newRow[i] &&
      newRow[i + 1] &&
      newRow[i]!.value === newRow[i + 1]!.value
    ) {
      const newValue = newRow[i]!.value * 2;
      const newTile = { value: newValue, isNew: false, isMerging: true };

      score += newValue; // Add merged value to the score
      newRow[i] = newTile; // Merge tiles
      newRow[i + 1] = null; // Set the next tile to null after merge
    }
  }

  return { newRow, score };
};

// Function to move and merge a single row or column
const moveAndMergeRow = (
  row: (Tile | null)[],
): { row: (Tile | null)[]; score: number } => {
  // reset the flag for merging and new tiles
  row.forEach((tile) => {
    if (tile) {
      tile.isMerging = false;
      tile.isNew = false;
    }
  });
  const slidRow = slide(row); // First slide to remove empty spaces
  const { newRow: mergedRow, score } = merge(slidRow); // Then merge adjacent tiles

  return { row: slide(mergedRow), score }; // Slide again to remove any new empty spaces
};

// Transpose the grid (convert columns to rows and vice versa) for vertical movement
const transposeGrid = (grid: Grid): Grid => {
  return grid[0].map((_, colIndex) => grid.map((row) => row[colIndex]));
};

// Function to move the grid based on direction
const moveGrid = (
  grid: Grid,
  direction: Direction,
): { newGrid: Grid; score: number } => {
  let newGrid: Grid;
  let totalScore = 0;

  switch (direction) {
    case "left":
      // Move left: process each row normally
      newGrid = grid.map((row) => {
        const { row: newRow, score } = moveAndMergeRow(row);

        totalScore += score;

        return newRow;
      });
      break;

    case "right":
      // Move right: reverse each row, process, then reverse again
      newGrid = grid.map((row) => {
        const reversedRow = [...row].reverse();
        const { row: newRow, score } = moveAndMergeRow(reversedRow);

        totalScore += score;

        return newRow.reverse(); // Reverse back to get the correct order
      });
      break;

    case "up":
      // Move up: transpose, process rows as columns, then transpose back
      newGrid = transposeGrid(
        transposeGrid(grid).map((row) => {
          const { row: newRow, score } = moveAndMergeRow(row);

          totalScore += score;

          return newRow;
        }),
      );
      break;

    case "down":
      // Move down: transpose, reverse rows (as columns), process, reverse, then transpose back
      newGrid = transposeGrid(
        transposeGrid(grid).map((row) => {
          const reversedRow = [...row].reverse();
          const { row: newRow, score } = moveAndMergeRow(reversedRow);

          totalScore += score;

          return newRow.reverse(); // Reverse back after processing
        }),
      );
      break;

    default:
      newGrid = grid; // Return the grid unchanged if no valid direction is provided
  }

  return { newGrid, score: totalScore };
};

export const initializeBoard = () => {
  let newGrid = getEmptyGrid();

  for (let i = 0; i < INITIAL_TILES; i++) {
    newGrid = spawnNewTile(newGrid);
  }

  return newGrid;
};

const game2048Reducer = (
  state: Game2048State,
  action: Action,
): Game2048State => {
  switch (action.type) {
    case "MOVE":
      console.log("Payload on MOVE", action);
      console.log("State on MOVE", state);
      const newBoards = { ...state.board };
      const newScores = { ...state.score };

      for (let boardKey in state.board) {
        if (boardKey !== action.peerId) {
          continue;
        }
        const { newGrid, score } = moveGrid(
          state.board[boardKey],
          action.payload,
        );
        const newScore = state.score[boardKey] + score;
        let updateGrid = newGrid;

        if (!gridsAreEqual(state.board[boardKey], newGrid)) {
          updateGrid = spawnNewTile(newGrid);
        }
        newBoards[boardKey] = updateGrid;
        newScores[boardKey] = newScore;
      }

      return {
        ...state,
        board: { ...newBoards },
        score: { ...newScores },
      };
    case "JOIN":
      console.log("Payload on JOIN", action.payload);
      const newState = state;
      let newNumPlayers = action.payload.numPlayers;

      newNumPlayers =
        state.totalPlayers > newNumPlayers ? state.totalPlayers : newNumPlayers;
      const playerCount = state.playerId.includes(action.peerId!)
        ? state.playersCount
        : state.playersCount + 1;

      newState.playersCount = playerCount;
      newState.totalPlayers = newNumPlayers;
      if (!state.playerId.includes(action.peerId!)) {
        newState.players[action.peerId!] = action.payload.name;
        newState.playerId.push(action.peerId!);
      }
      newState.board[action.peerId!] = action.payload.grid;
      newState.score[action.peerId!] = 0;

      return { ...newState };

    case "LEAVE":
      error("Not implemented yet");

      return state;
    default:
      return state;
  }
};

// Create Context
const Game2048Context = createContext<
  | [
      Game2048State,
      Dispatch<Action>,
      boolean,
      string,
      Dispatch<SetStateAction<string>>,
    ]
  | null
>(null);

export const Game2048Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialState: Game2048State = {
    board: {},
    score: {},
    players: {},
    playerId: [],
    playersCount: 0,
    totalPlayers: 0,
  };
  const [room, setRoom] = useState("");

  const [state, dispatch, connected] = useEdgeReducerV0(
    game2048Reducer,
    initialState,
    {
      topic: room ? `turbo-game2048-${room}` : "",
    },
  );

  return (
    <Game2048Context.Provider
      value={[state, dispatch, connected, room, setRoom]}
    >
      {children}
    </Game2048Context.Provider>
  );
};

export const use2048 = () => {
  const context = useContext(Game2048Context);

  if (!context) {
    throw new Error("use2048 must be used within a Game2048Provider");
  }

  return context;
};

export function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
