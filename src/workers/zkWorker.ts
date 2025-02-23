"use client";

import * as Comlink from "comlink";
import { Field, setNumberOfWorkers, SelfProof, ZkProgram } from "o1js";
import {
  Direction,
  GameBoard,
  GameBoardWithSeed,
  MAX_MOVES2,
  printBoard,
  ProofArray,
  BoardArray,
  myProof,
} from "../lib/game2048ZKLogic";
import { DirectionMap, MoveType } from "@/utils/constants";
import { Game2048ZKProgram } from "@/lib/game2048ZKProgram";
import { Board } from "@/reducer/2048";

export const zkWorkerAPI = {
  async compileZKProgram() {
    const result = await Game2048ZKProgram.compile();
    console.log("Compiled ZK program");
    return result;
  },

  async baseCase(
    initBoard: GameBoardWithSeed,
    newBoard: GameBoardWithSeed,
    moves: string[],
  ): Promise<string> {
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
    const result = await Game2048ZKProgram.baseCase(boardArr, directions);

    //Difference here: we need to push the new proof to the proof queue
    //in zkClient, rather than storing it locally here on the worker.
    console.log("[generateZKProof] Generated proof");

    console.log(result.proof);

    //TODO: sort this out
    return JSON.stringify(result.proof.toJSON());
  },

  async baseCaseAux(
    boardNums0: Number[],
    seedNum0: bigint,
    boardNums1: Number[],
    seedNum1: bigint,
    moves: string[],
  ): Promise<string> {
    console.log("on worker [aux]");
    console.log(boardNums0);
    console.log(boardNums1);
    const zkBoardWithSeed0 = this.auxSub(boardNums0, seedNum0);
    const zkBoardWithSeed1 = this.auxSub(boardNums1, seedNum1);

    return await this.baseCase(zkBoardWithSeed0, zkBoardWithSeed1, moves);
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

  async inductiveStep(proofjson1: string, proofjson2: string): Promise<string> {
    const proof1: SelfProof<void, BoardArray> = await ZkProgram.Proof(
      Game2048ZKProgram,
    ).fromJSON(JSON.parse(proofjson1));
    const proof2: SelfProof<void, BoardArray> = await ZkProgram.Proof(
      Game2048ZKProgram,
    ).fromJSON(JSON.parse(proofjson2));

    let result = await Game2048ZKProgram.inductiveStep(proof1, proof2);
    return JSON.stringify(result.proof.toJSON());
  },
};

Comlink.expose(zkWorkerAPI);
