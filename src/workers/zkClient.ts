"use client";

import * as Comlink from "comlink";
import { Dispatch } from "react";

import {
  GameBoardWithSeed,
  MAX_MOVES,
  printBoard,
} from "@/lib/game2048ZKLogic";
import { Action } from "@/reducer/2048";
import { Field, PrivateKey, Signature } from "o1js";
import { minaSessionKey } from "@/app/mina/MinaSessionKeyProvider";
import { DirectionMap, MoveType } from "@/utils/constants";

export class ZkClient {
  worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import("./zkWorker").zkWorkerAPI>;

  compiled = false;
  isProcessing = false;
  moveCache: string[] = [];
  boardCache: GameBoardWithSeed[] = [];
  intervalId: number | null = null;
  dispatch: Dispatch<Action>;
  sessionKey: PrivateKey;

  constructor() {
    // Initialize the worker from the zkWorker module
    if (typeof window !== "undefined") {
      this.worker = new Worker(new URL("./zkWorker.ts", import.meta.url), {
        type: "module",
      });

      // Wrap the worker with Comlink to enable direct method invocation
      this.remoteApi = Comlink.wrap(this.worker);
      this.sessionKey = minaSessionKey();
      this.startInterval();
    }
  }

  async loadContracts() {
    if (this.compiled) {
      return;
    }

    const result = await this.remoteApi.loadContracts();
    this.compiled = true;
    console.log("Compiled ZK program");

    return result;
  }

  setDispatch(dispatch: Dispatch<Action>) {
    this.dispatch = dispatch;
  }

  async setActiveNetwork(network: string) {
    return this.remoteApi.setActiveNetwork(network);
  }

  startInterval() {
    this.intervalId = window.setInterval(async () => {
      if (!this.compiled) {
        console.debug("Still compiling, skipping interval");

        return;
      }
      if (this.isProcessing) {
        console.debug("Still processing, skipping interval");

        return;
      }
      if (this.moveCache.length === 0) {
        console.debug("No moves to process, skipping interval");

        return;
      }
      this.isProcessing = true;
      console.log("Generating proof for moves", this.moveCache);
      const moves = this.moveCache.slice(0, MAX_MOVES);
      const idxBoard = moves.length - 1;
      const boardState = this.boardCache[idxBoard];

      this.moveCache = this.moveCache.slice(MAX_MOVES);
      this.boardCache = this.boardCache.slice(idxBoard + 1);
      const boardNums = boardState
        .getBoard()
        .cells.map((cell) => Number(cell.toBigInt()));
      const seedNums = boardState.getSeed().toBigInt();

      console.log("Generating proof for moves", moves);
      console.log("Moves left in cache", this.moveCache);

      const [, proofJSON] = await this.remoteApi.generateProof(
        boardNums,
        seedNums,
        moves,
      );

      this.dispatch({
        type: "SEND_PROOF",
        payload: {
          proof: proofJSON,
        },
      });
      this.isProcessing = false;
    }, 500);
  }

  async initZKProof(zkBoard: GameBoardWithSeed) {
    console.log("Initializing ZK proof", zkBoard);
    this.isProcessing = true;

    let isNotCompiledAtFirst = false;

    while (!this.compiled) {
      isNotCompiledAtFirst = true;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (isNotCompiledAtFirst) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    printBoard(zkBoard.getBoard());
    const boardNums = zkBoard
      .getBoard()
      .cells.map((cell) => Number(cell.toBigInt()));
    const seedNums = zkBoard.getSeed().toBigInt();

    const [proof, proofJSON] = await this.remoteApi.initZKProof(
      boardNums,
      seedNums,
      this.sessionKey.toBase58(),
    );

    if (this.dispatch) {
      this.dispatch({
        type: "SEND_PROOF",
        payload: {
          proof: proofJSON,
        },
      });
    }

    this.isProcessing = false;

    return proof;
  }

  async addMove(zkBoard: GameBoardWithSeed, move: string) {
    console.log("Adding move to cache", zkBoard, move);
    console.log("isProcessing", this.isProcessing);
    this.moveCache.push(move);
    this.boardCache.push(zkBoard);
    console.log("Move added to cache: ", this.moveCache.length);
  }

  async fetchAccount(publicKey58: string) {
    return await this.remoteApi.fetchAccount(publicKey58);
  }

  async fetch2048Score(publicKey58: string) {
    return await this.remoteApi.fetch2048Score(publicKey58);
  }

  async submitScore(publicKey58: string) {
    if (!this.compiled) {
      throw new Error("ZK program is not compiled");
    }
    return await this.remoteApi.submitScore(publicKey58);
  }

  async fetchLeaderboard() {
    return await this.remoteApi.fetchLeaderboard();
  }
}

// Global Singleton
export const zkClient = new ZkClient();
