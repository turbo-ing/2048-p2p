import * as Comlink from "comlink";
import { Field, Proof } from "o1js";

import { Game2048ZKProgram } from "@/lib/game2048ZKProgram";
import {
  Direction,
  GameBoard,
  GameBoardWithSeed,
  printBoard,
} from "@/lib/game2048ZKLogic";
import { DirectionMap, MoveType } from "@/utils/constants";

const proofCache: { [key: string]: Proof<GameBoardWithSeed, void> } = {};

export const zkWorkerAPI = {
  async compileZKProgram() {
    await Game2048ZKProgram.compile();
  },

  async initZKProof(peerId: string, boardNums: Number[], seedNum: Number) {
    console.log("[Worker] Initializing ZK proof", peerId, boardNums, seedNum);
    const boardFields = boardNums.map((cell) => Field(cell.valueOf()));
    const zkBoard = new GameBoard(boardFields);
    const seed = Field(seedNum.valueOf());

    printBoard(zkBoard);

    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
    });

    const result = await Game2048ZKProgram.initialize(zkBoardWithSeed);

    proofCache[peerId] = result.proof;

    return result.proof;
  },

  async generateZKProof(
    peerId: string,
    zkBoard: GameBoardWithSeed,
    moves: string[],
  ) {
    console.log("[generateZKProof] peerId", peerId);
    const previousProof = proofCache[peerId];
    const directionsFields = moves.map((move) => {
      return Field.from(DirectionMap[move as MoveType] ?? 0);
    });
    const directions = new Direction(directionsFields);
    // console.log(directions);

    const result = await Game2048ZKProgram.verifyTransition(
      zkBoard,
      previousProof,
      directions,
    );

    // Update the proof cache
    proofCache[peerId] = result.proof;
    console.log("[generateZKProof] Generated proof");

    return result.proof;
  },

  async addMoveToCache(
    peerId: string,
    boardNums: Number[],
    seedNum: bigint,
    moves: string[],
  ) {
    const boardFields = boardNums.map((cell) => Field(cell.valueOf()));
    const zkBoard = new GameBoard(boardFields);
    const seed = Field(seedNum);
    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
    });
    // printBoard(zkBoard);

    return this.generateZKProof(peerId, zkBoardWithSeed, moves);
  },
};

Comlink.expose(zkWorkerAPI);
