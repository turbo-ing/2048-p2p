import { EdgeAction, useEdgeReducerV0 } from "@turbo-ing/edge-v0";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { keccak256, toHex } from "viem";

import { gridsAreEqual, getGameState } from "@/utils/helper";

export type Direction = "up" | "down" | "left" | "right";

export interface Tile {
  id: string;
  value: number;
  isNew: boolean;
  isMerging: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

export type Board = {
  grid: Grid;
  merges: MergeEvent[];
};

export type Grid = (Tile | null)[][];
export type Game2048State = {
  board: { [playerId: string]: Board };
  score: { [playerId: string]: number };
  playerId: string[];
  players: { [playerId: string]: string };
  playersCount: number;
  totalPlayers: number;
  isFinished: { [playerId: string]: boolean };
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
  const gridString = JSON.stringify(
    grid.flatMap((row) =>
      row.flatMap((tile) => {
        if (tile) {
          return { value: tile.value, x: tile.x, y: tile.y };
        }
        return [];
      }),
    ),
  );

  // Hash the JSON string using keccak256 and get the hexadecimal representation
  const hash = keccak256(toHex(gridString));

  // Convert a portion of the hash into a number (e.g., first 8 characters of the hex string)
  return parseInt(hash.slice(0, 8), 16);
};

// Helper functions
// const getNewTile = (): number => (Math.random() < 0.9 ? 2 : 4);
const getNewTile = (x: number, y: number): Tile => ({
  id: crypto.randomUUID(),
  value: 2,
  isNew: true,
  isMerging: false,
  x,
  y,
  prevX: x,
  prevY: y,
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
  newGrid[pos.x][pos.y] = getNewTile(pos.y, pos.x); // Add a new tile to the grid

  return newGrid;
};

// Helper to slide tiles in a row (remove nulls, and slide values to the left)
const slide = (row: (Tile | null)[]): (Tile | null)[] => {
  const newRow = row.filter((val) => val !== null); // Filter out nulls
  const emptySpaces = GRID_SIZE - newRow.length; // Calculate empty spaces

  return [...newRow, ...new Array(emptySpaces).fill(null)]; // Add empty spaces to the end
};

export interface MergeEvent {
  tile1: { startX: number; startY: number };
  tile2: { startX: number; startY: number };
  tileId: string;
  to?: { x: number; y: number };
  value: number;
}

interface MergeResult {
  newRow: (Tile | null)[];
  score: number;
  merges: MergeEvent[];
}

// Helper to merge tiles in a row (combine adjacent tiles with the same value)
const merge = (row: (Tile | null)[], rowIndex: number): MergeResult => {
  let score = 0;
  // We'll collect all merges that happen in this row
  const merges: MergeEvent[] = [];

  // Make a copy so we don't mutate the original array directly
  const newRow = [...row];

  for (let i = 0; i < GRID_SIZE - 1; i++) {
    const tile1 = newRow[i];
    const tile2 = newRow[i + 1];

    // Check if we can merge
    if (tile1 && tile2 && tile1.value === tile2.value) {
      const newValue = tile1.value * 2;

      // Create the merged tile
      const newTile: Tile = {
        id: crypto.randomUUID(),
        value: newValue,
        isNew: false,
        isMerging: true,
        x: rowIndex,
        y: i,
        // isMoving: false,
        prevX: tile1.x,
        prevY: tile1.y,
      };
      // Record the merge event using the original positions and values
      merges.push({
        tile1: {
          startX: tile1.x,
          startY: tile1.y,
        },
        tile2: {
          startX: tile2.x,
          startY: tile2.y,
        },
        to: {
          x: rowIndex,
          y: i,
        },
        tileId: newTile.id,
        value: tile1.value,
      });

      score += newValue;

      // Replace tile1 with the merged tile, clear tile2
      newRow[i] = newTile;
      newRow[i + 1] = null;
    }
  }

  return { newRow, score, merges };
};

interface MoveAndMergeRowResult {
  row: (Tile | null)[];
  score: number;
  merges: MergeEvent[];
}
// Function to move and merge a single row or column
const moveAndMergeRow = (
  row: (Tile | null)[],
  rowIndex: number,
): MoveAndMergeRowResult => {
  // First, reset the merging and new flags, and store previous positions
  row.forEach((tile) => {
    if (tile) {
      tile.isMerging = false;
      tile.isNew = false;
      tile.prevX = tile.x;
      tile.prevY = tile.y;
    }
  });

  // Slide to remove empty spaces
  const slidRow = slide(row);

  // Merge adjacent tiles
  const { newRow: mergedRow, score, merges } = merge(slidRow, rowIndex);
  // Slide again after merge
  const finalRow = slide(mergedRow);

  // Return the final row, plus total score from merges, plus the merge events
  return { row: finalRow, score, merges };
};

// Transpose the grid (convert columns to rows and vice versa) for vertical movement
const transposeGrid = (grid: Grid): Grid => {
  return grid[0].map((_, colIndex) => grid.map((row) => row[colIndex]));
};

export interface GridMoveResult {
  newGrid: Grid;
  score: number;
  merges: MergeEvent[];
}

// Helper to find a tile by ID in a grid
function findTileById(grid: Grid, tileId: string): Tile | null {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const tile = grid[i][j];
      if (tile && tile.id === tileId) {
        return tile;
      }
    }
  }
  return null;
}

export function moveGrid(grid: Grid, direction: Direction): GridMoveResult {
  let workingGrid: Grid;
  let totalScore = 0;
  let mergeEvents: MergeEvent[] = [];

  switch (direction) {
    case "left": {
      // Move left: process each row as-is
      workingGrid = grid.map((row, rowIdx) => {
        const { row: newRow, score, merges } = moveAndMergeRow(row, rowIdx);
        mergeEvents.push(...merges);
        totalScore += score;
        return newRow;
      });
      break;
    }

    case "right": {
      // Move right:
      // 1. Reverse each row
      // 2. Merge
      // 3. Reverse back to final orientation
      workingGrid = grid.map((row, rowIdx) => {
        const reversedRow = [...row].reverse();

        const {
          row: mergedRow,
          score,
          merges,
        } = moveAndMergeRow(reversedRow, rowIdx);
        totalScore += score;
        mergeEvents.push(...merges);

        return mergedRow.reverse(); // restore to normal left->right
      });
      break;
    }

    case "up": {
      // Move up:
      // 1. Transpose
      // 2. Merge each row
      // 3. Transpose back
      const transposed = transposeGrid(grid);
      const mergedTransposed = transposed.map((row, rowIdx) => {
        const { row: newRow, score, merges } = moveAndMergeRow(row, rowIdx);
        mergeEvents.push(...merges);
        totalScore += score;
        return newRow;
      });
      workingGrid = transposeGrid(mergedTransposed);
      break;
    }

    case "down": {
      // Move down:
      // 1. Transpose
      // 2. Reverse each row
      // 3. Merge
      // 4. Reverse back
      // 5. Transpose back
      const transposed = transposeGrid(grid); // columns -> rows
      const reversedTransposed = transposed.map((row) => [...row].reverse());

      const mergedReversedTransposed = reversedTransposed.map((row, rowIdx) => {
        const { row: newRow, score, merges } = moveAndMergeRow(row, rowIdx);
        mergeEvents.push(...merges);
        totalScore += score;
        return newRow;
      });

      const restoredTransposed = mergedReversedTransposed.map((row) =>
        [...row].reverse(),
      );
      workingGrid = transposeGrid(restoredTransposed);
      break;
    }

    default:
      // No valid direction provided, return grid unchanged
      return {
        newGrid: grid,
        score: 0,
        merges: [],
      };
  }

  // AFTER final orientation: assign x,y for each tile
  for (let rowIdx = 0; rowIdx < workingGrid.length; rowIdx++) {
    for (let colIdx = 0; colIdx < workingGrid[rowIdx].length; colIdx++) {
      const tile = workingGrid[rowIdx][colIdx];
      if (tile) {
        tile.x = colIdx; // x = column
        tile.y = rowIdx; // y = row
      }
    }
  }

  // Find the new tile id in the new position regardless of what
  // transformations(reverse/transpose) has been applied
  mergeEvents.forEach((evt) => {
    const mergedTile = findTileById(workingGrid, evt.tileId);
    if (mergedTile) {
      evt.to = { x: mergedTile.x, y: mergedTile.y };
    } else {
      console.warn("Could not find merged tile in final grid:", evt);
    }
  });

  return {
    newGrid: workingGrid,
    score: totalScore,
    merges: mergeEvents,
  };
}

export const initializeBoard = () => {
  let newGrid = getEmptyGrid();

  console.log("initializeBoard new", newGrid);

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
      const newFin = { ...state.isFinished };

      for (let boardKey in state.board) {
        if (boardKey !== action.peerId) {
          continue;
        }

        const { newGrid, score, merges } = moveGrid(
          state.board[boardKey].grid,
          action.payload,
        );
        const newScore = state.score[boardKey] + score;
        let updateGrid = newGrid;

        if (!gridsAreEqual(state.board[boardKey].grid, newGrid)) {
          updateGrid = spawnNewTile(newGrid);
        }
        newBoards[boardKey].grid = updateGrid;
        newBoards[boardKey].merges = merges;
        newScores[boardKey] = newScore;

        let gameState = getGameState(newBoards[boardKey].grid);
        if (gameState != "RUNNING") {
          newFin[boardKey] = true;
        }
      }

      return {
        ...state,
        board: { ...newBoards },
        score: { ...newScores },
        isFinished: { ...newFin },
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
      newState.board[action.peerId!] = {
        grid: action.payload.grid,
        merges: [],
      };
      newState.score[action.peerId!] = 0;
      newState.isFinished[action.peerId!] = false;

      return { ...newState };

    case "LEAVE":
      //error("Not implemented yet");
      console.log("Player " + action.peerId! + " is leaving the game.");
      console.log(state);
      const leaveState = state;
      leaveState.playersCount -= 1;
      //leaveState.totalPlayers -= 1;
      delete leaveState.board[action.peerId!];
      delete leaveState.score[action.peerId!];
      delete leaveState.players[action.peerId!];
      delete leaveState.isFinished[action.peerId!];
      delete leaveState.playerId[leaveState.playerId.indexOf(action.peerId!)];
      console.log(leaveState);
      return leaveState;
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
    isFinished: {},
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
