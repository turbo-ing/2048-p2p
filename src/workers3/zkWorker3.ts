"use client";

import * as Comlink from "comlink";
import { Field, setNumberOfWorkers, SelfProof } from "o1js";
import {
  Direction,
  GameBoard,
  GameBoardWithSeed,
  MAX_MOVES2,
  printBoard,
  ProofArray,
  BoardArray,
  myProof,
} from "../lib2/game2048ZKLogic2";
import { DirectionMap, MoveType } from "@/utils/constants";
import { Game2048ZKProgram3 } from "@/lib2/game2048ZKProgram3";

export const zkWorkerAPI3 = {
  async compileZKProgram() {
    const result = await Game2048ZKProgram3.compile();
    console.log("Compiled ZK program");
    return result;
  },

  async baseCase(
    initBoard: GameBoardWithSeed,
    newBoard: GameBoardWithSeed,
    moves: string[],
  ): Promise<[SelfProof<void, BoardArray>, string]> {
    //Generate the BoardArray for newBoard.
    let boardArr: BoardArray = new BoardArray([initBoard, newBoard]);

    console.log("is it here?");

    //Generate the Direction from moves[].
    const directionsFields = moves.map((move) => {
      return Field.from(DirectionMap[move as MoveType] ?? 0);
    });

    console.log("or here?");

    //Fill out the moves array.
    if (directionsFields.length < MAX_MOVES2) {
      // pad with 0
      for (let i = directionsFields.length; i < MAX_MOVES2; i++) {
        directionsFields.push(Field.from(0));
      }
    }

    console.log("or even... here?");

    const directions = new Direction(directionsFields);

    console.log("perhaps at the end?");

    //Invoke the program function based on the old function.
    const result = await Game2048ZKProgram3.baseCase(boardArr, directions);

    //Difference here: we need to push the new proof to the proof queue
    //in zkClient, rather than storing it locally here on the worker.
    console.log("[generateZKProof] Generated proof");

    //TODO: sort this out
    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },

  async baseCaseAux(
    boardNums0: Number[],
    seedNum0: bigint,
    boardNums1: Number[],
    seedNum1: bigint,
    moves: string[],
  ): Promise<[SelfProof<void, BoardArray>, string]> {
    const zkBoardWithSeed0 = this.auxSub(boardNums0, seedNum0);
    const zkBoardWithSeed1 = this.auxSub(boardNums1, seedNum1);

    return this.baseCase(zkBoardWithSeed0, zkBoardWithSeed1, moves);
  },

  auxSub(boardNums: Number[], seedNum: bigint) {
    const boardFields = boardNums.map((cell) => Field(cell.valueOf()));
    const zkBoard = new GameBoard(boardFields);
    const seed = Field(seedNum);
    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
    });

    return zkBoardWithSeed;
  },

  async inductiveStep(
    proof1: SelfProof<void, BoardArray>,
    board1: GameBoardWithSeed,
    proof2: SelfProof<void, BoardArray>,
    board2: GameBoardWithSeed,
  ): Promise<[myProof, string]> {
    //Make call to function
    const result = await Game2048ZKProgram3.inductiveStep(proof1, proof2);

    //Return the result
    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },

  async inductiveStepAux(
    proof1: SelfProof<void, BoardArray>,
    board1nums: number[],
    seed1nums: bigint,
    proof2: SelfProof<void, BoardArray>,
    board2nums: number[],
    seed2nums: bigint,
  ): Promise<[myProof, string]> {
    const board1 = this.auxSub(board1nums, seed1nums);
    const board2 = this.auxSub(board2nums, seed2nums);

    return this.inductiveStep(proof1, board1, proof2, board2);
  },
};

Comlink.expose(zkWorkerAPI3);
