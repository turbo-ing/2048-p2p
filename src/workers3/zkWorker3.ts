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
import { Board } from "@/reducer/2048";

export const zkWorkerAPI3 = {
  async compileZKProgram() {
    const result = await Game2048ZKProgram3.compile();
    console.log("Compiled ZK program");
    return result;
  },

  async initialise(
    boardNums: Number[],
    seedNum: bigint,
  ): Promise<[SelfProof<void, BoardArray>, string]> {
    console.log("[Worker] Initializing ZK proof", boardNums, seedNum);
    const boardFields = boardNums.map((cell) => Field.from(cell.valueOf()));
    const zkBoard2 = new GameBoard(boardFields);
    const seed = Field.from(seedNum);

    //printBoard(zkBoard2);

    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard2,
      seed: seed,
    });

    console.log(zkBoardWithSeed);

    const result = await Game2048ZKProgram3.baseistCase(zkBoardWithSeed);

    console.log("[generateZKProof] Generated initial proof");

    console.log(result.proof);

    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },

  async baseCase(
    initBoard: GameBoardWithSeed,
    newBoard: GameBoardWithSeed,
    moves: string[],
  ): Promise<[SelfProof<void, BoardArray>, string]> {
    //Generate the BoardArray for newBoard.
    let boardArr: BoardArray = new BoardArray([initBoard, newBoard]);

    //Generate the Direction from moves[].
    const directionsFields = moves.map((move) => {
      return Field.from(DirectionMap[move as MoveType] ?? 0);
    });

    //Fill out the moves array.
    if (directionsFields.length < MAX_MOVES2) {
      // pad with 0
      for (let i = directionsFields.length; i < MAX_MOVES2; i++) {
        directionsFields.push(Field.from(0));
      }
    }

    const directions = new Direction(directionsFields);

    //Invoke the program function based on the old function.
    const result = await Game2048ZKProgram3.baseCase(boardArr, directions);

    //Difference here: we need to push the new proof to the proof queue
    //in zkClient, rather than storing it locally here on the worker.
    console.log("[generateZKProof] Generated proof");

    console.log(result.proof);

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
    console.log("on worker [aux]");
    console.log(boardNums0);
    console.log(boardNums1);
    const zkBoardWithSeed0 = this.auxSub(boardNums0, seedNum0);
    const zkBoardWithSeed1 = this.auxSub(boardNums1, seedNum1);

    console.debug(zkBoardWithSeed0);
    console.debug(zkBoardWithSeed1);

    return this.baseCase(zkBoardWithSeed0, zkBoardWithSeed1, moves);
  },

  auxSub(boardNums: Number[], seedNum: bigint) {
    console.log("on auxsub");
    console.log(boardNums);
    const boardFields = boardNums.map((cell) => Field.from(cell.valueOf()));
    const zkBoard = new GameBoard(boardFields);
    const seed = Field.from(seedNum);
    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
    });

    return zkBoardWithSeed;
  },

  /*
  async inductiveStepAlt(
    proof1: SelfProof<void, BoardArray>,
    proof2: SelfProof<void, BoardArray>,
  ): Promise<[SelfProof<void, BoardArray>, string]> {
    //Make call to function
    const result = await Game2048ZKProgram3.inductiveStep(proof1, proof2);

    //Return the result
    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },
  */

  async inductiveStep(
    proof1: SelfProof<void, BoardArray>,
    board11: GameBoardWithSeed,
    board12: GameBoardWithSeed,
    proof2: SelfProof<void, BoardArray>,
    board21: GameBoardWithSeed,
    board22: GameBoardWithSeed,
  ): Promise<[SelfProof<void, BoardArray>, string]> {
    console.log(proof1);
    console.log(board11);
    console.log(board12);
    console.log(proof2);
    console.log(board21);
    console.log(board22);
    //Make call to function
    const result = await Game2048ZKProgram3.inductiveStep(
      proof1,
      board11,
      board12,
      proof2,
      board21,
      board22,
    );

    //Return the result
    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },

  //function to reconstruct a proof's board with seed such that it will not break
  async reconstruct(brokenboard: GameBoardWithSeed) {
    //structure of broken values: [0, [0, [VALUEn]]]
    const brokencells = brokenboard.board.cells;
    const brokenseed = brokenboard.seed;

    let fixedcells = [];
    for (let cell of brokencells) {
      fixedcells.push(Field.from(await this.extract(cell)));
    }
    let fixedboard = new GameBoard(fixedcells);
    let fixedseed = Field.from(await this.extract(brokenseed));
    return new GameBoardWithSeed({ board: fixedboard, seed: fixedseed });
  },

  async extract(brokenseed: Field): Promise<bigint> {
    const brokenseed1 = brokenseed.value[1];
    const brokenseed2 = brokenseed1 as [number, bigint];
    const bigintseed: bigint = brokenseed2[1];
    const newField = Field.from(bigintseed);
    //console.log(newField);
    return bigintseed;
  },

  async inductiveStepAux2(
    proof1: SelfProof<void, BoardArray>,
    proof2: SelfProof<void, BoardArray>,
  ): Promise<[SelfProof<void, BoardArray>, string]> {
    //get 4 boards from 2 proofs
    const board11 = await this.reconstruct(proof1.publicOutput.value[0]);
    const board12 = await this.reconstruct(proof1.publicOutput.value[1]);
    const board21 = await this.reconstruct(proof2.publicOutput.value[0]);
    const board22 = await this.reconstruct(proof2.publicOutput.value[1]);

    //do the thing to get the nums from all 4 boards (sigh)

    console.log("Worker AUX2 logs");
    console.log(board11);
    console.log(board21);
    console.log(board12);
    console.log(board22);

    const boardNums11 = board11
      .getBoard()
      .cells.map((cell) => Number(cell.toBigInt()));
    const seedNum11 = board11.getSeed().toBigInt();

    const boardNums12 = board12
      .getBoard()
      .cells.map((cell) => Number(cell.toBigInt()));
    const seedNum12 = board12.getSeed().toBigInt();

    const boardNums21 = board21
      .getBoard()
      .cells.map((cell) => Number(cell.toBigInt()));
    const seedNum21 = board21.getSeed().toBigInt();

    const boardNums22 = board22
      .getBoard()
      .cells.map((cell) => Number(cell.toBigInt()));
    const seedNum22 = board22.getSeed().toBigInt();

    //Make call to function
    const result = this.inductiveStepAux(
      proof1,
      boardNums11,
      seedNum11,
      boardNums12,
      seedNum12,
      proof2,
      boardNums21,
      seedNum21,
      boardNums22,
      seedNum22,
    );

    //Return the result
    return result;
  },

  async inductiveStepAux(
    proof1: SelfProof<void, BoardArray>,
    board11nums: Number[],
    seed11nums: bigint,
    board12nums: Number[],
    seed12nums: bigint,
    proof2: SelfProof<void, BoardArray>,
    board21nums: Number[],
    seed21nums: bigint,
    board22nums: Number[],
    seed22nums: bigint,
  ): Promise<[SelfProof<void, BoardArray>, string]> {
    const board11 = this.auxSub(board11nums, seed11nums);
    const board12 = this.auxSub(board12nums, seed12nums);
    const board21 = this.auxSub(board21nums, seed21nums);
    const board22 = this.auxSub(board22nums, seed22nums);

    return this.inductiveStep(
      proof1,
      board11,
      board12,
      proof2,
      board21,
      board22,
    );
  },
};

Comlink.expose(zkWorkerAPI3);
