"use client";

import {
  EdgeAction,
  InputConfig,
  RTC,
  RTCServerConfig,
  useEdgeReducerV0,
} from "@turbo-ing/turbo-p2p-react";
import { Group, Config } from "@turbo-ing/turbo-p2p";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { Bool, Field, PublicKey, UInt64 } from "o1js";

import { zkClient, ZkClient } from "@/workers/zkClient";
import {
  addRandomTile,
  applyOneMoveCircuit,
  GameBoard,
  GameBoardWithSeed,
  printBoard,
} from "@/lib/game2048ZKLogic";
import { DirectionMap, MoveType } from "@/utils/constants";
import { queueMove } from "@/workers/zkQueue";
import { gridsAreEqual, getGameState } from "@/utils/helper";
import { minaSessionKey } from "@/app/mina/MinaSessionKeyProvider";

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
  minaSessionKeys: { [playerId: string]: PublicKey };
  minaWallet: { [playerId: string]: PublicKey };
  isFinished: { [playerId: string]: boolean };
  surrendered: { [playerId: string]: boolean };
  playersCount: number;
  totalPlayers: number;
  compiledProof: { [playerId: string]: string };
  actionPeerId?: string;
  actionDirection?: MoveType;
  rematch: { [playerId: string]: boolean };
  timer: number;

  minaAmount: number;
  minaDeposit: { [playerId: string]: string };
  minaDepositSignatures: { [playerId: string]: string };
  deployed: { [playerId: string]: boolean };
  zkCompleted: { [playerId: string]: boolean };

  seed: bigint;
  receivedWelcome: boolean;
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
    minaSessionKey: string;
    minaWallet?: string;
    numPlayers?: number;
    minaAmount?: number;
    isHost: boolean;
  };
}

interface WelcomeAction extends EdgeAction<Game2048State> {
  type: "WELCOME";
  payload: {
    name: string;
    grid: Grid;
    zkBoard: GameBoardWithSeed;
    minaSessionKey: string;
    minaWallet?: string;
    score: number;
    isFinished: boolean;
    surrendered: boolean;
    totalPlayers: number;
    minaAmount: number;
    minaDeposit: { [playerId: string]: string };
  };
}

interface DepositAction extends EdgeAction<Game2048State> {
  type: "DEPOSIT";
  payload: {
    minaDeposit: string;
  };
}

interface DepositSignatureAction extends EdgeAction<Game2048State> {
  type: "DEPOSIT_SIGNATURE";
  payload: {
    signature: string;
  };
}

interface DeployedAction extends EdgeAction<Game2048State> {
  type: "DEPLOYED";
}

interface ZKCompletedAction extends EdgeAction<Game2048State> {
  type: "ZK_COMPLETED";
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

interface RematchAction extends EdgeAction<Game2048State> {
  type: "REMATCH";
}

interface TimerAction extends EdgeAction<Game2048State> {
  type: "TIMER";
  payload: {
    time: number;
    ended: boolean;
  };
}

interface ResetAction extends EdgeAction<Game2048State> {
  type: "RESET";
}

interface KeepAliveAction extends EdgeAction<Game2048State> {
  type: "KEEPALIVE";
}

// Action Types
export type Action =
  | MoveAction
  | JoinAction
  | WelcomeAction
  | DepositAction
  | DepositSignatureAction
  | DeployedAction
  | ZKCompletedAction
  | LeaveAction
  | SendProofAction
  | RematchAction
  | TimerAction
  | ResetAction
  | KeepAliveAction;

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
  if (totalScore > 0) {
    mergeEvents.forEach((evt) => {
      const mergedTile = findTileById(workingGrid, evt.tileId);
      if (mergedTile) {
        evt.to = { x: mergedTile.x, y: mergedTile.y };
      } else {
        console.warn("Could not find merged tile in final grid:", evt);
      }
    });
  }

  return {
    newGrid: workingGrid,
    score: totalScore,
    merges: mergeEvents,
  };
}

// ==== End move animation logic ====

export const initBoardWithSeed = (seed: bigint): [Grid, GameBoardWithSeed] => {
  const zkBoard = new GameBoardWithSeed({
    board: new GameBoard(new Array(16).fill(Field.from(0))),
    seed: Field.from(seed),
    sessionKey: minaSessionKey().toPublicKey(),
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
  if (!action.peerId) return state;

  switch (action.type) {
    case "MOVE":
      if (!state.isFinished[action.peerId]) {
        console.log("Payload on MOVE", action);
        console.log("State on MOVE", state);
        const newBoards = { ...state.board };
        const newScores = { ...state.score };
        const newZkBoards = { ...state.zkBoard };
        const newFin = { ...state.isFinished };

        for (let boardKey in state.board) {
          if (boardKey !== action.peerId) {
            continue;
          }

          const dir = Field.from(DirectionMap[action.payload] ?? 0);
          const oldZkBoard = new GameBoard(
            state.zkBoard[boardKey].board.cells.map(Field),
          );
          // Ensure GameBoard type
          let currentZkBoard = oldZkBoard;
          let currentZkSeed = Field.from(state.zkBoard[boardKey].seed);
          console.log("currentZkSeed old", currentZkSeed);
          const newZkBoard = applyOneMoveCircuit(currentZkBoard, dir);
          const equalBool = newZkBoard
            .hash()
            .equals(currentZkBoard.hash())
            .not();

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
            sessionKey: state.minaSessionKeys[boardKey],
          });
          newScores[boardKey] = state.score[boardKey] + score;

          let gameState = getGameState(newBoards[boardKey].grid);
          if (gameState != "RUNNING") {
            newFin[boardKey] = true;
          }

          queueMove(action.peerId, newZkBoards[boardKey], action.payload);
        }

        return {
          ...state,
          board: { ...newBoards },
          zkBoard: { ...newZkBoards },
          score: { ...newScores },
          isFinished: { ...newFin },
          actionPeerId: action.peerId,
          actionDirection: action.payload,
        };
      } else return { ...state };
    case "JOIN":
      console.log("Payload on JOIN", action.payload);

      let seed = state.seed;

      if (!seed) {
        seed = BigInt(Math.floor(Math.random() * 1000000000000));
      }

      // initialise board and seed
      const [grid, zkBoard] = initBoardWithSeed(seed);
      const payloadBoard = new GameBoardWithSeed({
        board: new GameBoard(zkBoard.board.cells.map(Field)),
        seed: Field.from(seed),
        sessionKey: PublicKey.fromBase58(action.payload.minaSessionKey),
      });

      printBoard(payloadBoard.board);

      // Create new copies of every sub-object rather than mutate old ones
      const newBoard = { ...state.board };
      const newPlayers = { ...state.players };
      const newPlayerId = [...state.playerId];
      const newZkBoard = { ...state.zkBoard };
      const newScore = { ...state.score };
      const newIsFinished = { ...state.isFinished };
      const newSurrendered = { ...state.surrendered };
      const newRematch = { ...state.rematch };
      const newMinaSessionKeys = { ...state.minaSessionKeys };
      const newMinaDeposit = { ...state.minaDeposit };
      const newMinaWallet = { ...state.minaWallet };

      // Figure out if we're adding a brand-new player
      // - If already in the list, don't increment player count
      let newPlayersCount = state.playersCount;
      if (!newPlayerId.includes(action.peerId!)) {
        newPlayersCount += 1;
        newPlayers[action.peerId!] = action.payload.name;
        newPlayerId.push(action.peerId!);
      }

      // For totalPlayers, either take action.payload.numPlayers or keep the existing if higher
      // (common for 2+ players game)
      let newNumPlayers = action.payload.numPlayers ?? state.totalPlayers;
      if (newNumPlayers < state.totalPlayers) {
        newNumPlayers = state.totalPlayers;
      }

      // Only update minaAmount if the payload amount is greater than 0
      let newMinaAmount = state.minaAmount;
      if (action.payload.minaAmount && action.payload.minaAmount > 0) {
        newMinaAmount = action.payload.minaAmount;
      }

      // Assign the new player's board
      newBoard[action.peerId!] = {
        grid,
        merges: [],
      };
      newZkBoard[action.peerId!] = payloadBoard;
      newScore[action.peerId!] = 0;
      newIsFinished[action.peerId!] = false;
      newSurrendered[action.peerId!] = false;
      newRematch[action.peerId!] = false;
      newMinaSessionKeys[action.peerId!] = PublicKey.fromBase58(
        action.payload.minaSessionKey,
      );
      if (action.payload.minaWallet) {
        newMinaWallet[action.peerId!] = PublicKey.fromBase58(
          action.payload.minaWallet,
        );
      }

      console.log("Payload Board Session Key", payloadBoard.sessionKey);

      // Only queue the "init" move if we're the host (creating room)
      if (action.payload.isHost) {
        console.log("Host: Queueing init move");
        queueMove(action.peerId!, payloadBoard, "init");
      } else {
        console.log("Joiner: Will queue init move in WELCOME");
      }

      // Now return a brand-new state object
      return {
        ...state,
        board: newBoard,
        zkBoard: newZkBoard,
        players: newPlayers,
        playerId: newPlayerId,
        score: newScore,
        isFinished: newIsFinished,
        surrendered: newSurrendered,
        rematch: newRematch,
        playersCount: newPlayersCount,
        totalPlayers: newNumPlayers,
        actionPeerId: action.peerId,
        minaSessionKeys: newMinaSessionKeys,
        minaAmount: newMinaAmount,
        minaDeposit: newMinaDeposit,
        minaWallet: newMinaWallet,
        seed,
      };
    case "WELCOME": {
      console.log("Payload on WELCOME", action.payload);

      // Skip if we already have this peer in our state
      if (state.players[action.peerId!]) {
        console.log(
          `Skipping WELCOME from ${action.peerId} - already in state`,
        );
        return state;
      }

      // Re-create the board from the payload
      const payloadBoard = new GameBoardWithSeed({
        board: new GameBoard(action.payload.zkBoard.board.cells.map(Field)),
        seed: Field.from(action.payload.zkBoard.seed),
        sessionKey: PublicKey.fromBase58(action.payload.minaSessionKey),
      });

      // Create new copies of every sub-object rather than mutate old ones
      const newBoard = { ...state.board };
      const newPlayers = { ...state.players };
      const newPlayerId = [...state.playerId];
      const newZkBoard = { ...state.zkBoard };
      const newScore = { ...state.score };
      const newIsFinished = { ...state.isFinished };
      const newSurrendered = { ...state.surrendered };
      const newRematch = { ...state.rematch };
      const newMinaSessionKeys = { ...state.minaSessionKeys };
      const newMinaDeposit = { ...state.minaDeposit };
      const newMinaWallet = { ...state.minaWallet };

      // Add the existing player if not already present
      let newPlayersCount = state.playersCount;
      if (!newPlayerId.includes(action.peerId!)) {
        newPlayersCount += 1;
        newPlayers[action.peerId!] = action.payload.name;
        newPlayerId.push(action.peerId!);
      }

      // Update total players from the welcome message
      let newTotalPlayers = Math.max(
        action.payload.totalPlayers,
        state.totalPlayers,
      );

      // Extract seed from the WELCOME message
      const welcomeSeed = action.payload.zkBoard.seed;
      const seedBigInt = BigInt(welcomeSeed.toString());

      console.log("Received seed from WELCOME:", seedBigInt);

      // Find our own peer ID (we should already be in the player list from our JOIN)
      const currentPeerId = state.playerId.find(
        (peerId) => state.players[peerId] && peerId !== action.peerId,
      );

      // Only initialize our board if this is the first WELCOME message
      if (currentPeerId && !state.receivedWelcome) {
        console.log(
          "First WELCOME - updating our board with seed:",
          seedBigInt,
        );

        // Generate our own board using the same seed from the host
        const [ourGrid, ourZkBoard] = initBoardWithSeed(seedBigInt);
        const ourPayloadBoard = new GameBoardWithSeed({
          board: new GameBoard(ourZkBoard.board.cells.map(Field)),
          seed: Field.from(seedBigInt),
          sessionKey:
            newZkBoard[currentPeerId]?.sessionKey || PublicKey.empty(),
        });

        // Update our own board with the synchronized seed
        newBoard[currentPeerId] = {
          grid: ourGrid,
          merges: [],
        };
        newZkBoard[currentPeerId] = ourPayloadBoard;

        // Queue the "init" move for our board
        queueMove(currentPeerId, ourPayloadBoard, "init");
      } else if (currentPeerId) {
        console.log("Already received WELCOME - skipping board initialization");
      }

      // Assign the existing player's current state
      newBoard[action.peerId!] = {
        grid: action.payload.grid,
        merges: [],
      };
      newZkBoard[action.peerId!] = payloadBoard;
      newScore[action.peerId!] = action.payload.score;
      newIsFinished[action.peerId!] = action.payload.isFinished;
      newSurrendered[action.peerId!] = action.payload.surrendered;
      newRematch[action.peerId!] = false; // Reset rematch for consistency
      newMinaSessionKeys[action.peerId!] = PublicKey.fromBase58(
        action.payload.minaSessionKey,
      );
      if (action.payload.minaWallet) {
        newMinaWallet[action.peerId!] = PublicKey.fromBase58(
          action.payload.minaWallet,
        );
      }

      // For joining players, update their minaAmount and minaDeposit
      let newMinaAmount = state.minaAmount;

      // If we're the host (our peerId is in the players list but not the joining peerId)
      const isHost =
        state.playerId.includes(action.peerId!) &&
        action.peerId !== currentPeerId;
      if (isHost) {
        // If we're the host, keep our minaAmount
        newMinaAmount = state.minaAmount;
      } else {
        // If we're joining, use the host's minaAmount
        newMinaAmount = action.payload.minaAmount;
      }

      // Merge deposits from all players
      if (action.payload.minaDeposit) {
        Object.entries(action.payload.minaDeposit).forEach(
          ([peerId, amount]) => {
            newMinaDeposit[peerId] = amount;
          },
        );
      }

      return {
        ...state,
        board: newBoard,
        zkBoard: newZkBoard,
        players: newPlayers,
        playerId: newPlayerId,
        score: newScore,
        isFinished: newIsFinished,
        surrendered: newSurrendered,
        rematch: newRematch,
        playersCount: newPlayersCount,
        totalPlayers: newTotalPlayers,
        minaSessionKeys: newMinaSessionKeys,
        minaAmount: newMinaAmount,
        minaDeposit: newMinaDeposit,
        minaWallet: newMinaWallet,
        seed: seedBigInt,
        receivedWelcome: true,
      };
    }
    case "DEPOSIT": {
      console.log("Payload on DEPOSIT", action.payload);
      const newMinaDeposit = { ...state.minaDeposit };
      newMinaDeposit[action.peerId!] = action.payload.minaDeposit;
      return { ...state, minaDeposit: newMinaDeposit };
    }
    case "DEPLOYED": {
      console.log("Received DEPLOYED from", action.peerId!);
      const deployedState = { ...state.deployed };
      deployedState[action.peerId!] = true;
      return { ...state, deployed: deployedState };
    }
    case "DEPOSIT_SIGNATURE": {
      console.log("Received deposit signature from", action.peerId!);
      const minaSignatureState = { ...state.minaDepositSignatures };
      minaSignatureState[action.peerId!] = action.payload.signature;
      return { ...state, minaDepositSignatures: minaSignatureState };
    }
    case "ZK_COMPLETED": {
      console.log("Received ZK_COMPLETED from", action.peerId!);
      const zkState = state;
      zkState.zkCompleted[action.peerId!] = true;
      return { ...zkState };
    }
    case "LEAVE":
      console.log("Player " + action.peerId! + " is leaving the game.");
      console.log(state);
      const leaveState = state;

      //Player left before finishing. They surrendered.
      if (!leaveState.isFinished[action.peerId!]) {
        leaveState.surrendered[action.peerId!] = true;
        leaveState.isFinished[action.peerId!] = true;
      }

      return { ...leaveState };

    case "SEND_PROOF":
      let receivedProof = JSON.stringify(action.payload);
      console.log(`Payload received: ${receivedProof} from ${action.peerId}`);
      const proofState = state;
      proofState.compiledProof[action.peerId!] = receivedProof;
      return { ...proofState };

    case "REMATCH":
      let rematchState = state;

      if (rematchState.rematch[action.peerId!]) {
        rematchState.rematch[action.peerId!] = false;
      } else {
        rematchState.rematch[action.peerId!] = true;
      }

      return { ...rematchState };

    case "TIMER":
      let timerState = state;
      //clock finished?
      if (action.payload.ended) {
        //if ended, we do this idempotent function
        for (var p in timerState.playerId) {
          timerState.isFinished[timerState.playerId[p]] = true;
        }
        console.log("set state to true");
        //no, clock starting!
      } else {
        timerState.timer = action.payload.time;
      }
      return { ...timerState };

    case "RESET":
      let resetState = state;
      for (var p in resetState.playerId) {
        resetState.isFinished[resetState.playerId[p]] = false;
      }
      console.log("reset states!");
      return { ...resetState };

    case "KEEPALIVE":
      console.log("[Reducer] KEEP ALIVE");
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
      RTC | null,
      (inputConfig: InputConfig) => Promise<void>,
      (group: Group) => Promise<void>,
      () => void,
      (topic: string, code?: string) => Promise<Group[]>,
      Config | undefined,
      string[] | undefined,
      ZkClient,
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
    compiledProof: {},
    isFinished: {},
    surrendered: {},
    rematch: {},
    timer: 0,
    minaSessionKeys: {},
    minaWallet: {},
    minaAmount: 0,
    minaDeposit: {},
    minaDepositSignatures: {},
    deployed: {},
    zkCompleted: {},

    seed: 0n,
    receivedWelcome: false,
  };
  const [room, setRoom] = useState("");

  let serverConfig: RTCServerConfig = {
    httpUrl: /*"http://localhost:4001", //*/ "https://rtc-server.turbo.ing:443",
    wsUrl: /*"ws://localhost:4002", //*/ "wss://rtc-server-ws.turbo.ing:443",
  };

  const [
    state,
    dispatch,
    rawDispatch,
    initialized,
    rtc,
    init,
    createRoom,
    joinRoom,
    leaveRoom,
    getRooms,
    rtcConfig,
    rtcPeers,
  ] = useEdgeReducerV0(
    game2048Reducer,
    initialState,
    {
      topic: "game2048",
    },
    serverConfig,
  );

  // Initialize game and track peer changes
  useEffect(() => {
    init();
    //rawDispatch({ type: 'INIT_LOCAL_PLAYER', payload: { peerId: rtcConfig.peer.peerIdString } });
  }, [initialized]);

  // Handle WELCOME dispatch when new players join
  useEffect(() => {
    const currentPeerId = rtcConfig?.peer?.peerIdString;

    // If we have an actionPeerId (someone just performed an action) and it's a different peer
    // and we are an existing player, send a WELCOME message
    if (
      state.actionPeerId &&
      currentPeerId &&
      state.actionPeerId !== currentPeerId &&
      state.players[currentPeerId] &&
      state.players[state.actionPeerId] // The action peer is now in our player list (they joined)
    ) {
      // Small delay to ensure JOIN is fully processed
      const timer = setTimeout(() => {
        dispatch({
          type: "WELCOME",
          payload: {
            name: state.players[currentPeerId],
            grid: state.board[currentPeerId]?.grid || getEmptyGrid(),
            zkBoard: state.zkBoard[currentPeerId],
            minaSessionKey:
              state.minaSessionKeys[currentPeerId]?.toBase58() || "",
            score: state.score[currentPeerId] || 0,
            isFinished: state.isFinished[currentPeerId] || false,
            surrendered: state.surrendered[currentPeerId] || false,
            totalPlayers: state.totalPlayers,
            minaAmount: state.minaAmount,
            minaDeposit: state.minaDeposit,
            minaWallet:
              state.minaWallet[currentPeerId]?.toBase58() ?? undefined,
          },
        });
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [state.actionPeerId, state.players, rtcConfig?.peer?.peerIdString]);

  // Dispatch KEEPALIVE every 10 seconds when in a room
  useEffect(() => {
    const currentPeerId = rtcConfig?.peer?.peerIdString;
    const isInRoom = currentPeerId && state.players[currentPeerId];

    if (isInRoom) {
      console.log("Starting KEEPALIVE timer - dispatching every 10 seconds");
      const keepAliveInterval = setInterval(() => {
        dispatch({
          type: "KEEPALIVE",
        });
      }, 10000); // 10 seconds

      return () => {
        console.log("Clearing KEEPALIVE timer");
        clearInterval(keepAliveInterval);
      };
    }
  }, [state.players, rtcConfig?.peer?.peerIdString, dispatch]);

  return (
    <Game2048Context.Provider
      value={[
        state,
        dispatch,
        rtc,
        createRoom,
        joinRoom,
        leaveRoom,
        getRooms,
        rtcConfig,
        rtcPeers,
        zkClient,
      ]}
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
