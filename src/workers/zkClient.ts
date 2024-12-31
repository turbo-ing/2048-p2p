import * as Comlink from "comlink";

import { GameBoardWithSeed, printBoard } from "@/lib/game2048ZKLogic";

export default class ZkClient {
  worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import("./zkWorker").zkWorkerAPI>;

  constructor() {
    // Initialize the worker from the zkWorker module
    this.worker = new Worker(new URL("./zkWorker.ts", import.meta.url), {
      type: "module",
    });

    // Wrap the worker with Comlink to enable direct method invocation
    this.remoteApi = Comlink.wrap(this.worker);
  }

  async compileZKProgram() {
    return this.remoteApi.compileZKProgram();
  }

  async initZKProof(peerId: string, zkBoard: GameBoardWithSeed) {
    console.log("Initializing ZK proof", peerId, zkBoard);
    printBoard(zkBoard.getBoard());

    return this.remoteApi.initZKProof(peerId, zkBoard);
  }

  async addMove(peerId: string, zkBoard: GameBoardWithSeed, move: string) {
    console.log("Adding move to cache", peerId, zkBoard, move);

    return this.remoteApi.addMoveToCache(peerId, zkBoard, move);
  }
}
