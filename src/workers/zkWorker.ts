import * as Comlink from "comlink";
import { Field, Proof } from "o1js";

import { Game2048ZKProgram } from "@/lib/game2048ZKProgram";
import { Grid } from "@/reducer/2048";
import {
  Direction,
  GameBoard,
  MAX_MOVES,
  printBoard,
} from "@/lib/game2048ZKLogic";

let compiled = false;
const proofCache: { [key: string]: Proof<GameBoard, void> } = {};
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

  async initZKProof(peerId: string, grid: Grid) {
    let fields: Field[] = [];

    console.log("Initializing ZK proof");
    console.log(grid);

    grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile) {
          fields.push(Field(tile.value));
        } else {
          fields.push(Field(0));
        }
      });
    });
    console.log(fields);
    const publicInput = new GameBoard(fields);

    printBoard(publicInput);

    const result = await Game2048ZKProgram.initialize(publicInput);

    proofCache[peerId] = result.proof;

    console.log("Initialized ZK proof");

    return result.proof;
  },

  async generateZKProof(peerId: string, grid: Grid, moves: string[]) {
    let fields: Field[] = [];

    grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile) {
          fields.push(Field(tile.value));
        } else {
          fields.push(Field(0));
        }
      });
    });
    console.log("Generating ZK proof");
    console.log(grid);
    const newBoard = new GameBoard(fields);

    console.log("New board");
    printBoard(newBoard);
    console.log("proofCache", proofCache[peerId]);
    const proof = proofCache[peerId];

    console.log("Previous board");
    printBoard(proof.publicInput);

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
      newBoard,
      proof,
      directions,
    );

    proofCache[peerId] = result.proof;
    console.log("Generated ZK proof");

    return result.proof;
  },

  async addMoveToCache(peerId: string, grid: Grid, move: string) {
    if (!moveCache[peerId]) {
      moveCache[peerId] = [];
    }
    moveCache[peerId].push(move);
    if (moveCache[peerId].length < MAX_MOVES) {
      console.log("Added move to cache", moveCache[peerId].length);

      return;
    }
    const moves = moveCache[peerId];

    proofCache[peerId] = await this.generateZKProof(peerId, grid, moves);
    moveCache[peerId] = [];
  },
};

Comlink.expose(zkWorkerAPI);
