import * as Comlink from "comlink";
import { Field, Proof } from "o1js";

import { Game2048ZKProgram } from "@/lib/game2048ZKProgram";
import {
  Direction,
  GameBoard,
  GameBoardWithSeed,
  MAX_MOVES,
  printBoard,
} from "@/lib/game2048ZKLogic";
import { DirectionMap, MoveType } from "@/utils/constants";

let proofCache: Proof<GameBoardWithSeed, void> | null = null;

export const zkWorkerAPI = {
  async compileZKProgram() {
    await Game2048ZKProgram.compile();
  },

  async initZKProof(
    boardNums: Number[],
    seedNum: Number,
  ): Promise<[Proof<GameBoardWithSeed, void>, string]> {
    console.log("[Worker] Initializing ZK proof", boardNums, seedNum);
    const boardFields = boardNums.map((cell) => Field(cell.valueOf()));
    const zkBoard = new GameBoard(boardFields);
    const seed = Field(seedNum.valueOf());

    printBoard(zkBoard);

    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
    });

    const result = await Game2048ZKProgram.initialize(zkBoardWithSeed);

    proofCache = result.proof;

    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },

  async generateZKProof(
    zkBoard: GameBoardWithSeed,
    moves: string[],
  ): Promise<[Proof<GameBoardWithSeed, void>, string]> {
    console.log("[generateZKProof] peerId");
    if (!proofCache) {
      throw new Error("Proof cache is not initialized");
    }
    const directionsFields = moves.map((move) => {
      return Field.from(DirectionMap[move as MoveType] ?? 0);
    });

    if (directionsFields.length < MAX_MOVES) {
      // pad with 0
      for (let i = directionsFields.length; i < MAX_MOVES; i++) {
        directionsFields.push(Field.from(0));
      }
    }
    const directions = new Direction(directionsFields);

    const result = await Game2048ZKProgram.verifyTransition(
      zkBoard,
      proofCache,
      directions,
    );

    // Update the proof cache
    proofCache = result.proof;
    console.log("[generateZKProof] Generated proof");

    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },

  async generateProof(
    boardNums: Number[],
    seedNum: bigint,
    moves: string[],
  ): Promise<[Proof<GameBoardWithSeed, void>, string]> {
    const boardFields = boardNums.map((cell) => Field(cell.valueOf()));
    const zkBoard = new GameBoard(boardFields);
    const seed = Field(seedNum);
    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
    });

    return this.generateZKProof(zkBoardWithSeed, moves);
  },
};

Comlink.expose(zkWorkerAPI);
