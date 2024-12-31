import * as Comlink from "comlink";
import { Field, Proof } from "o1js";

import { Game2048ZKProgram } from "@/lib/game2048ZKProgram";
import {
  Direction, GameBoard,
  GameBoardWithSeed,
  MAX_MOVES,
  printBoard,
} from "@/lib/game2048ZKLogic";

let compiled = false;
const proofCache: { [key: string]: Proof<GameBoardWithSeed, void> } = {};
const moveCache: { [key: string]: string[] } = {};

export const zkWorkerAPI = {
  async compileZKProgram() {
    if (compiled) {
      return;
    }
    await Game2048ZKProgram.compile();
    compiled = true;
    console.log("Compiled ZK program");
  },

  // async initZKProof(peerId: string, zkBoard: GameBoard, seed: Field) {
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

    console.log("[Worker] zkBoardWithSeed", zkBoardWithSeed);
    // printBoard(zkBoardWithSeed.getBoard());

    const result = await Game2048ZKProgram.initialize(zkBoardWithSeed);

    console.log("have result", result);

    proofCache[peerId] = result.proof;

    console.log("Initialized ZK proof");

    return result.proof;
  },

  async generateZKProof(
    peerId: string,
    zkBoard: GameBoardWithSeed,
    moves: string[],
  ) {
    console.log("proofCache", proofCache[peerId]);
    const proof = proofCache[peerId];

    let moveNums = moves.map((move) => {
      switch (move) {
        case "up":
          return 1;
        case "down":
          return 2;
        case "left":
          return 3;
        case "right":
          return 4;
        default:
          return 0;
      }
    });

    console.log(moveNums);

    const directionsFields = moveNums.map((d) => Field(d));
    const directions = new Direction(directionsFields);

    console.log(directions);

    const result = await Game2048ZKProgram.verifyTransition(
      zkBoard,
      proof,
      directions,
    );

    proofCache[peerId] = result.proof;
    console.log("Generated ZK proof");

    return result.proof;
  },

  async addMoveToCache(
    peerId: string,
    boardNums: Number[],
    seedNum: Number,
    move: string,
  ) {
    if (!moveCache[peerId]) {
      moveCache[peerId] = [];
    }
    moveCache[peerId].push(move);
    if (moveCache[peerId].length < MAX_MOVES) {
      console.log("Added move to cache", moveCache[peerId].length);

      return;
    }
    const moves = moveCache[peerId];

    const boardFields = boardNums.map((cell) => Field(cell.valueOf()));
    const zkBoard = new GameBoard(boardFields);
    const seed = Field(seedNum.valueOf());
    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
    });

    printBoard(zkBoard);

    proofCache[peerId] = await this.generateZKProof(
      peerId,
      zkBoardWithSeed,
      moves,
    );
    moveCache[peerId] = [];
  },
};

Comlink.expose(zkWorkerAPI);
