import * as Comlink from "comlink";

import {
  GameBoardWithSeed,
  MAX_MOVES,
  printBoard,
} from "@/lib/game2048ZKLogic";

export default class ZkClient {
  worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import("./zkWorker").zkWorkerAPI>;

  compiled = false;
  isProcessing = false;
  moveCache: { [key: string]: string[] } = {};
  boardCache: { [key: string]: GameBoardWithSeed[] } = {};
  intervalId: number | null = null;
  peerId: string;

  constructor(peerId: string) {
    // Initialize the worker from the zkWorker module
    this.worker = new Worker(new URL("./zkWorker.ts", import.meta.url), {
      type: "module",
    });

    // Wrap the worker with Comlink to enable direct method invocation
    this.remoteApi = Comlink.wrap(this.worker);
    this.peerId = peerId;
    if (!this.moveCache[peerId]) {
      this.moveCache[peerId] = [];
    }
    if (!this.boardCache[peerId]) {
      this.boardCache[peerId] = [];
    }
    this.startInterval();
  }

  async compileZKProgram() {
    if (this.compiled) {
      return;
    }
    await this.remoteApi.compileZKProgram();
    this.compiled = true;
    console.log("Compiled ZK program");
  }

  startInterval() {
    this.intervalId = window.setInterval(async () => {
      if (this.isProcessing) {
        console.log("Still processing, skipping interval");

        return;
      }
      if (this.moveCache[this.peerId].length === 0) {
        console.log("No moves to process, skipping interval");

        return;
      }
      this.isProcessing = true;
      console.log("Generating proof for moves", this.moveCache[this.peerId]);
      const moves = this.moveCache[this.peerId].slice(0, MAX_MOVES);
      const idxBoard = moves.length - 1;
      const boardState = this.boardCache[this.peerId][idxBoard];

      this.moveCache[this.peerId] = this.moveCache[this.peerId].slice(MAX_MOVES);
      this.boardCache[this.peerId] = this.boardCache[this.peerId].slice(
        idxBoard + 1,
      );
      const boardNums = boardState
        .getBoard()
        .cells.map((cell) => Number(cell.toBigInt()));
      const seedNums = boardState.getSeed().toBigInt();

      console.log("Generating proof for moves", moves);
      console.log("Moves left in cache", this.moveCache[this.peerId]);

      await this.remoteApi.addMoveToCache(
        this.peerId,
        boardNums,
        seedNums,
        moves,
      );
      this.isProcessing = false;
    }, 10000);
  }

  async initZKProof(peerId: string, zkBoard: GameBoardWithSeed) {
    console.log("Initializing ZK proof", peerId, zkBoard);
    this.isProcessing = true;
    printBoard(zkBoard.getBoard());
    const boardNums = zkBoard
      .getBoard()
      .cells.map((cell) => Number(cell.toBigInt()));
    const seedNums = Number(zkBoard.getSeed().toBigInt());

    const proof = await this.remoteApi.initZKProof(peerId, boardNums, seedNums);

    this.isProcessing = false;

    return proof;
  }

  async addMove(peerId: string, zkBoard: GameBoardWithSeed, move: string) {
    console.log("Adding move to cache", peerId, zkBoard, move);
    console.log("isProcessing", this.isProcessing);
    this.moveCache[peerId].push(move);
    this.boardCache[peerId].push(zkBoard);
    console.log("Move added to cache: ", this.moveCache[peerId].length);
    // if (this.moveCache[peerId].length < MAX_MOVES || this.isProcessing) {
    //   console.log("Move added to cache: ", this.moveCache[peerId].length);
    //
    //   return;
    // }

    // this.isProcessing = true;
    // console.log("Generating proof for moves", this.moveCache[peerId]);
    // const moves = this.moveCache[peerId].slice(0, MAX_MOVES);
    // const idxBoard = moves.length - 1;
    // const boardState = this.boardCache[peerId][idxBoard];
    //
    // this.moveCache[peerId] = this.moveCache[peerId].slice(MAX_MOVES);
    // this.boardCache[peerId] = this.boardCache[peerId].slice(idxBoard + 1);
    // const boardNums = boardState
    //   .getBoard()
    //   .cells.map((cell) => Number(cell.toBigInt()));
    // const seedNums = boardState.getSeed().toBigInt();
    //
    // console.log("Generating proof for moves", moves);
    // console.log("Moves left in cache", this.moveCache[peerId]);
    //
    // await this.remoteApi.addMoveToCache(peerId, boardNums, seedNums, moves);
    // this.isProcessing = false;
  }
}
