"use client";

// ### Very rare error caused by something in this file/ in the zk workers ###

// Error: The global context managed by o1js reached an inconsistent state. This could be caused by one of the following reasons:

// - You are missing an 'await' somewhere, which causes a new global context to be entered before we finished the last one.

// - You are importing two different instances of o1js, which leads to inconsistent tracking of the global context in one of those instances.
//   - This is a common problem in projects that use o1js as part of a UI!

// - You are running multiple async operations concurrently, which conflict in using the global context.
//   - Running async o1js operations (like proving) in parallel is not supported! Try running everything serially.

// Investigate the stack traces below for more hints about the problem.

// We wanted to leave the global context entered here:
//     at Yr (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2141:9673)
//     at Function.enter (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2141:9429)
//     at Object.$ [as initialize] (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2207:206)
//     at Object.initZKProof (webpack-internal:///(app-pages-browser)/./src/workers/zkWorker.ts:32:100)
//     at callback (webpack-internal:///(app-pages-browser)/./node_modules/comlink/dist/esm/comlink.mjs:116:48)

// But we actually would have left the global context entered here:
//     at Yr (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2141:9673)
//     at Function.enter (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2141:9429)
//     at Object.$ [as initialize] (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2207:206)
//     at Object.initZKProof (webpack-internal:///(app-pages-browser)/./src/workers/zkWorker.ts:32:100)
//     at callback (webpack-internal:///(app-pages-browser)/./node_modules/comlink/dist/esm/comlink.mjs:116:48)

// Our first recommendation is to check for a missing 'await' in the second stack trace.

// Source
// src/workers/zkWorker.ts (41:44) @ initialize

//   39 |     });
//   40 |
// > 41 |     const result = await Game2048ZKProgram.initialize(zkBoardWithSeed);
//      |                                            ^
//   42 |
//   43 |     proofCache = result.proof;
//   44 |

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
    const result = await Game2048ZKProgram.compile();
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
