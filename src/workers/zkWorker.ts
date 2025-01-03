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

let compiled = false;
const proofCache: { [key: string]: Proof<GameBoardWithSeed, void> } = {};
const moveCache: { [key: string]: string[] } = {};

export const zkWorkerAPI = {
  async compileZKProgram() {
    if (compiled) {
      return null;
    }
    const result = await Game2048ZKProgram.compile();
    compiled = true;
    console.log("Compiled ZK program");
    return result;
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

    const directionsFields = moves.map((move) => {
      return Field.from(DirectionMap[move as MoveType] ?? 0);
    });
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
    seedNum: bigint,
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
    const seed = Field(seedNum);
    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
    });
    console.log("[addMoveToCache] seedNum", seedNum);
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
