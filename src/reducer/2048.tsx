"use client";

import { EdgeAction, useEdgeReducerV0 } from "@turbo-ing/edge-v0";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { Bool, Field, UInt64 } from "o1js";

import ZkClient from "@/workers/zkClient";
import {
  addRandomTile,
  applyOneMoveCircuit,
  GameBoard,
  GameBoardWithSeed,
  printBoard,
} from "@/lib/game2048ZKLogic";
import { DirectionMap, MoveType } from "@/utils/constants";
import { gridsAreEqual } from "@/utils/helper";

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
  zkBoard: { [playerId: string]: GameBoardWithSeed };
  score: { [playerId: string]: number };
  playerId: string[];
  players: { [playerId: string]: string };
  playersCount: number;
  totalPlayers: number;
  actionPeerId?: string;
  actionDirection?: MoveType;
};

// Constants for grid size and initial tiles
export const GRID_SIZE = 4;
export const INITIAL_TILES = 2;

interface MoveAction extends EdgeAction<Game2048State> {
  type: "MOVE";
  payload: MoveType;
}

interface JoinAction extends EdgeAction<Game2048State> {
  type: "JOIN";
  payload: {
    name: string;
    grid: Grid;
    zkBoard: GameBoardWithSeed;
    numPlayers: number;
  };
}

interface LeaveAction extends EdgeAction<Game2048State> {
  type: "LEAVE";
}

interface SendProofAction extends EdgeAction<Game2048State> {
  type: "SEND_PROOF";
  payload: {
    proof: string;
  };
}

// Action Types
export type Action = MoveAction | JoinAction | LeaveAction | SendProofAction;

const error = (message: string) => {
  console.error(message);
};

export const getEmptyGrid = (): Grid => {
  const grid: Grid = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    grid.push(new Array(GRID_SIZE).fill(null));
  }

  return grid;
};

export interface MergeEvent {
  tile1: { startX: number; startY: number };
  tile2: { startX: number; startY: number };
  tileId: string;
  to?: { x: number; y: number };
  value: number;
}

// ==== Move animation logic ====

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

// Helper to slide tiles in a row (remove nulls, and slide values to the left)
const slide = (row: (Tile | null)[]): (Tile | null)[] => {
  const newRow = row.filter((val) => val !== null); // Filter out nulls
  const emptySpaces = GRID_SIZE - newRow.length; // Calculate empty spaces

  return [...newRow, ...new Array(emptySpaces).fill(null)]; // Add empty spaces to the end
};

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

// ==== End move animation logic ====

export const initBoardWithSeed = (seed: number): [Grid, GameBoardWithSeed] => {
  const zkBoard = new GameBoardWithSeed({
    board: new GameBoard(new Array(16).fill(Field.from(0))),
    seed: Field.from(seed),
  });

  let board = zkBoard.getBoard();
  let seedField = zkBoard.getSeed();

  for (let i = 0; i < INITIAL_TILES; i++) {
    [board, seedField] = addRandomTile(board, seedField, new Bool(true));
  }
  zkBoard.setBoard(board);
  zkBoard.setSeed(seedField);

  let grid = getEmptyGrid();

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const cell = Number(board.getCell(i, j).toBigInt()).valueOf();

      if (cell === 0) {
        grid[i][j] = null;
      } else {
        grid[i][j] = {
          value: cell,
          isNew: true,
          isMerging: false,
          id: crypto.randomUUID(),
          prevY: i,
          prevX: j,
          y: i,
          x: j,
        };
      }
    }
  }

  console.log("initializeBoard new", grid);

  return [grid, zkBoard];
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
      const newZkBoards = { ...state.zkBoard };

      for (let boardKey in state.board) {
        if (boardKey !== action.peerId) {
          continue;
        }

        const dir = Field.from(DirectionMap[action.payload] ?? 0);
        const oldZkBoard = state.zkBoard[boardKey].board;
        let currentZkBoard = oldZkBoard;
        let currentZkSeed = state.zkBoard[boardKey].seed;
        console.log("currentZkSeed old", currentZkSeed);
        const newZkBoard = applyOneMoveCircuit(currentZkBoard, dir);
        const equalBool = newZkBoard.hash().equals(currentZkBoard.hash()).not();

        if (!equalBool.toBoolean()) {
          console.log("------No change state with this move");

          return state;
        }

        currentZkBoard = newZkBoard;
        [currentZkBoard, currentZkSeed] = addRandomTile(
          currentZkBoard,
          currentZkSeed,
          equalBool,
        );
        console.log("Old ZK Board");
        printBoard(oldZkBoard);
        console.log("New ZK Board");
        printBoard(newZkBoard);
        console.log("Current ZK Board");
        printBoard(currentZkBoard);
        console.log("Current ZK Seed 2", currentZkSeed);
        let idxNew = -1;

        for (let i = 0; i < newZkBoard.cells.length; i++) {
          if (
            currentZkBoard.cells[i]
              .equals(newZkBoard.cells[i])
              .not()
              .toBoolean()
          ) {
            idxNew = i;
            break;
          }
        }

        const { newGrid, score, merges } = moveGrid(
          state.board[boardKey].grid,
          action.payload,
        );

        console.log("New Board");
        console.log(newGrid);

        if (idxNew != -1) {
          const i = Math.floor(idxNew / GRID_SIZE);
          const j = idxNew % GRID_SIZE;

          newGrid[i][j] = {
            value: 2,
            isNew: true,
            isMerging: false,
            id: crypto.randomUUID(),
            prevY: i,
            prevX: j,
            y: i,
            x: j,
          };
        }

        newBoards[boardKey].grid = newGrid;
        newBoards[boardKey].merges = merges;
        newZkBoards[boardKey] = new GameBoardWithSeed({
          board: currentZkBoard,
          seed: currentZkSeed,
        });
        newScores[boardKey] = state.score[boardKey] + score;
      }

      return {
        ...state,
        board: { ...newBoards },
        zkBoard: { ...newZkBoards },
        score: { ...newScores },
        actionPeerId: action.peerId,
        actionDirection: action.payload,
      };
    case "JOIN":
      console.log("Payload on JOIN", action.payload);
      printBoard(action.payload.zkBoard.board);
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
      newState.zkBoard[action.peerId!] = action.payload.zkBoard;
      newState.board[action.peerId!] = {
        grid: action.payload.grid,
        merges: [],
      };
      newState.score[action.peerId!] = 0;
      newState.actionPeerId = action.peerId;

      return { ...newState };

    case "LEAVE":
      error("Not implemented yet");

      return state;
    case "SEND_PROOF":
      console.log(
        `Payload received: ${JSON.stringify(action.payload)} from ${action.peerId}`,
      );

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
      ZkClient | null,
      Dispatch<SetStateAction<ZkClient | null>>,
    ]
  | null
>(null);

export const Game2048Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialState: Game2048State = {
    board: {},
    zkBoard: {},
    score: {},
    players: {},
    playerId: [],
    playersCount: 0,
    totalPlayers: 0,
  };
  const [zkClient, setZkClient] = useState<ZkClient | null>(null);
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
      value={[state, dispatch, connected, room, setRoom, zkClient, setZkClient]}
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
