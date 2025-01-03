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

export interface Tile {
  value: number;
  isNew: boolean;
  isMerging: boolean;
}

export type Grid = (Tile | null)[][];
export type Game2048State = {
  board: { [playerId: string]: Grid };
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

  let gird = getEmptyGrid();

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const cell = Number(board.getCell(i, j).toBigInt()).valueOf();

      if (cell === 0) {
        gird[i][j] = null;
      } else {
        gird[i][j] = {
          value: cell,
          isNew: true,
          isMerging: false,
        };
      }
    }
  }

  return [gird, zkBoard];
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
        let idxNew = 0;
        let totalScore = 0;

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

        const currentGird = getEmptyGrid();

        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
            const oldCell = new UInt64(oldZkBoard.getCell(row, col).value);
            const newCell = new UInt64(currentZkBoard.getCell(row, col).value);

            if (newCell.equals(UInt64.zero).toBoolean()) {
              currentGird[row][col] = null;
              continue;
            }
            if (newCell.equals(oldCell).toBoolean()) {
              currentGird[row][col] = {
                value: Number(newCell.toBigInt()),
                isNew: false,
                isMerging: false,
              };
              continue;
            }
            if (newCell.greaterThan(oldCell).toBoolean()) {
              const isMerged = newCell.greaterThan(new UInt64(2)).toBoolean();
              const idxNewCell = row * 4 + col;
              const isNew = idxNew === idxNewCell && !isMerged;

              totalScore = isMerged
                ? totalScore + Number(newCell.toBigInt()) / 2
                : totalScore;
              currentGird[row][col] = {
                value: Number(newCell.toBigInt()),
                isNew: isNew,
                isMerging: isMerged,
              };
              continue;
            }
            if (newCell.lessThan(oldCell).toBoolean()) {
              currentGird[row][col] = {
                value: Number(newCell.toBigInt()),
                isNew: false,
                isMerging: false,
              };
            }
          }
        }
        console.log("New Board");
        console.log(currentGird);
        newBoards[boardKey] = currentGird;
        newZkBoards[boardKey] = new GameBoardWithSeed({
          board: currentZkBoard,
          seed: currentZkSeed,
        });
        newScores[boardKey] = state.score[boardKey] + totalScore;
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
      newState.board[action.peerId!] = action.payload.grid;
      newState.score[action.peerId!] = 0;
      newState.actionPeerId = action.peerId;

      return { ...newState };

    case "LEAVE":
      error("Not implemented yet");

      return state;
    case "SEND_PROOF":
      console.log(`Payload received: ${JSON.stringify(action.payload)} from ${action.peerId}`);

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
