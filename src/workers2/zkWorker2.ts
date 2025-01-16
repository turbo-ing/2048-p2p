"use client";

import * as Comlink from "comlink";
import { Field, Proof, setNumberOfWorkers } from "o1js";

import { Game2048ZKProgram2 } from "@/lib2/game2048ZKProgram2";
import {
  Direction,
  GameBoard,
  GameBoardWithSeed,
  MAX_MOVES2,
  printBoard,
} from "../lib2/game2048ZKLogic2";
import { DirectionMap, MoveType } from "@/utils/constants";

let proofCache: Proof<GameBoardWithSeed, void> | null = null;

export const zkWorkerAPI2 = {
  async compileZKProgram() {
    const result = await Game2048ZKProgram2.compile();
    console.log("Compiled ZK program");
    return result;
  },

  async initZKProof(
    boardNums: Number[],
    seedNum: bigint,
  ): Promise<[Proof<GameBoardWithSeed, void>, string]> {
    console.log("[Worker] Initializing ZK proof", boardNums, seedNum);
    const boardFields = boardNums.map((cell) => Field(cell.valueOf()));
    const zkBoard = new GameBoard(boardFields);
    const seed = Field(seedNum);

    printBoard(zkBoard);

    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
    });

    const result = await Game2048ZKProgram2.initialize(zkBoardWithSeed);

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

    if (directionsFields.length < MAX_MOVES2) {
      // pad with 0
      for (let i = directionsFields.length; i < MAX_MOVES2; i++) {
        directionsFields.push(Field.from(0));
      }
    }
    const directions = new Direction(directionsFields);

    const result = await Game2048ZKProgram2.verifyTransition(
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

Comlink.expose(zkWorkerAPI2);
