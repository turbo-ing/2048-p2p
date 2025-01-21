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
    const result = await Game2048ZKProgram3.initialize(boardArr, directions);

    //Difference here: we need to push the new proof to the proof queue
    //in zkClient, rather than storing it locally here on the worker.
    console.log("[generateZKProof] Generated proof");

    //TODO: sort this out
    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },

  async inductiveStep(
    proof1: SelfProof<void, BoardArray>,
    proof2: SelfProof<void, BoardArray>,
  ): Promise<[myProof, string]> {
    //Make call to function
    const result = await Game2048ZKProgram3.verifyTransition(proof1, proof2);

    //Return the result
    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },
};

Comlink.expose(zkWorkerAPI3);
