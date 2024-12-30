import * as Comlink from "comlink";

import { Grid } from "@/reducer/2048";

export default class ZkClient {
  // worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import("./zkWorker").zkWorkerAPI>;

  constructor() {
    // Initialize the worker from the zkWorker module
    const worker = new Worker(new URL("./zkWorker.ts", import.meta.url), {
      type: "module",
    });

    // Wrap the worker with Comlink to enable direct method invocation
    this.remoteApi = Comlink.wrap(worker);
  }

  async compileZKProgram() {
    return this.remoteApi.compileZKProgram();
  }

  async initZKProof(peerId: string, grid: Grid) {
    return this.remoteApi.initZKProof(peerId, grid);
  }

  async addMove(peerId: string, grid: Grid, move: string) {
    console.log("Adding move to cache", peerId, grid, move);

    return this.remoteApi.addMoveToCache(peerId, grid, move);
  }
}
