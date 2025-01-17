"use client";

import * as Comlink from "comlink";
import { Field, setNumberOfWorkers } from "o1js";
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
import { Game2048ZKProgram2 } from "@/lib2/game2048ZKProgram2";

export const zkWorkerAPI2 = {
  async compileZKProgram() {
    const result = await Game2048ZKProgram2.compile();
    console.log("Compiled ZK program");
    return result;
  },

  async baseCase(
    initBoard: GameBoardWithSeed,
    newBoard: GameBoardWithSeed,
    moves: string[],
  ): Promise<[myProof, string]> {
    //Generate the BoardArray for newBoard.
    let boardArr: BoardArray = new BoardArray([initBoard, newBoard]);

    //Generate the Direction from moves[].
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

    //Invoke the program function based on the old function.
    const result = await Game2048ZKProgram2.initialize(boardArr, directions);

    //Difference here: we need to push the new proof to the proof queue
    //in zkClient, rather than storing it locally here on the worker.
    console.log("[generateZKProof] Generated proof");

    //TODO: sort this out
    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },

  async inductiveStep(proofArr: ProofArray): Promise<[myProof, string]> {
    //Make call to function
    const result = await Game2048ZKProgram2.verifyTransition(proofArr);

    //Return the result
    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },
};

Comlink.expose(zkWorkerAPI2);
