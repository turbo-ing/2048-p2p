"use client";

import * as Comlink from "comlink";
import { Dispatch } from "react";

import {
  GameBoardWithSeed,
  MAX_MOVES2,
  MAX_PARALLEL,
  printBoard,
  ProofArray,
  BoardArray,
  myProof,
  ProofWrapper,
} from "../lib2/game2048ZKLogic2";

import { Action } from "@/reducer/2048";

export default class ZkClient2 {
  worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import("./zkWorker2").zkWorkerAPI2>;

  compiled = false;
  workersProcessing = 0;
  moveQueue: string[] = [];
  proofQueue: myProof[] = [];

  //TODO: How to handle board storage?
  //    - Might be a good idea to store a boardQueue. That way, I can
  //      grab the same indexes from the boardQueue as from the moveQueue.

  //    - NOTE: We'll push the initial board at the start, such that
  //      boardQueue is always 1 longer than moveQueue.
  //    - This means that for some moveQueue index i, boardQueue[i] is
  //      the state of the board before that.
  //    - When removing moves from the moveQueue, we'll do the same for the
  //      boardQueue. CRUCIAL STEP: we need to get the new base index of the
  //      boardQueue, as this will store the new final state.
  initialBoard: GameBoardWithSeed;
  boardQueue: GameBoardWithSeed[];

  intervalId: number | null = null;
  dispatch: Dispatch<Action>;

  constructor() {
    // Initialize the worker from the zkWorker
    // TODO: Maybe create a set of workers? For parallelisation.
    if (typeof window !== "undefined") {
      this.worker = new Worker(new URL("./zkWorker2.ts", import.meta.url), {
        type: "module",
      });

      // Wrap the worker with Comlink to enable direct method invocation
      this.remoteApi = Comlink.wrap(this.worker);
      this.startInterval();
    }
  }

  setDispatch(dispatch: Dispatch<Action>) {
    this.dispatch = dispatch;
  }

  async compileZKProgram() {
    if (this.compiled) {
      return;
    }
    const result = await this.remoteApi.compileZKProgram();
    this.compiled = true;
    console.log("Compiled ZK program");
    return result;
  }

  startInterval() {
    this.intervalId = window.setInterval(async () => {
      let proofJSON;
      if (!this.compiled) {
        console.debug("Still compiling, skipping interval");

        return;
      }
      if (this.workersProcessing == MAX_PARALLEL) {
        console.debug("All workers processing, skipping interval");

        return;
      }
      if (
        this.moveQueue.length === 0 &&
        this.proofQueue.length === 0 &&
        this.workersProcessing == 0
      ) {
        console.debug(
          "No moves to process and no active workers, skipping interval",
        );

        return;
      } else if (this.proofQueue.length > MAX_PARALLEL) {
        //Highest priority if we have a lot of proofs remaining. If we can clear the proof queue optimally, then we should do so.
        this.workersProcessing += 1;

        //Peel off a section of the proofQueue
        const proofs = this.proofQueue.slice(0, MAX_PARALLEL);

        const proofWrappers = [];
        for (let proof of proofs) {
          proofWrappers.push(new ProofWrapper(proof));
        }
        const proofArr = new ProofArray(proofWrappers);

        const [proof, proofJSON] = await this.remoteApi.inductiveStep(proofArr);

        this.proofQueue.push(proof);

        //send proof
        this.dispatch({
          type: "SEND_PROOF",
          payload: {
            proof: proofJSON,
          },
        });

        this.workersProcessing -= 1;
      } else if (this.moveQueue.length > 0) {
        //We want to clear the moveQueue ideally before the proofQueue,
        //unless the latter has a large backlog.
        this.workersProcessing += 1;

        console.log("Generating proof for moves", this.moveQueue);

        //Peel off a section of the moveQueue and boardQueue
        const moves = this.moveQueue.slice(0, MAX_MOVES2);
        const boards = this.boardQueue.slice(0, MAX_MOVES2);

        //Remove those moves/boards from the queue also
        this.moveQueue = this.moveQueue.slice(MAX_MOVES2);
        this.boardQueue = this.boardQueue.slice(MAX_MOVES2);

        //refer to notes at boardQueuedeclaration
        let initBoard = boards[0];
        let newBoard = this.boardQueue[0];

        console.log("Generating proof for moves", moves);
        console.log("Moves left in cache", this.moveQueue);

        const [proof, proofJSON] = await this.remoteApi.baseCase(
          initBoard,
          newBoard,
          moves,
        );

        this.proofQueue.push(proof);

        //send proof
        this.dispatch({
          type: "SEND_PROOF",
          payload: {
            proof: proofJSON,
          },
        });

        this.workersProcessing -= 1;
      } else if (this.proofQueue.length > 0) {
        //We only deal with remaining proofs in the queue if there's nothing else to do.
        //This should be the last step.
        this.workersProcessing += 1;

        //Peel off a section of the proofQueue
        const proofs = this.proofQueue.slice(0, MAX_PARALLEL);

        //Create proof array
        const proofWrappers = [];
        for (let proof of proofs) {
          proofWrappers.push(new ProofWrapper(proof));
        }
        const proofArr = new ProofArray(proofWrappers);

        const [proof, proofJSON] = await this.remoteApi.inductiveStep(proofArr);

        this.proofQueue.push(proof);

        //send proof
        this.dispatch({
          type: "SEND_PROOF",
          payload: {
            proof: proofJSON,
          },
        });

        this.workersProcessing -= 1;
      }
    }, 500);
  }

  //I don't think I need this function tbh

  /*
  async generateProof(zkBoard: GameBoardWithSeed) {
    console.log("Initializing ZK proof", zkBoard);
    this.isProcessing = true;

    //Wait until circuit compiles.
    while (!this.compiled) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    //Invoke the base case (Two states and some transitions -> proof).
    //We 'hire' a worker from the pool to do this.
    const [proof, proofJSON] = await this.remoteApi.baseCase(
      zkBoard, //new board
      this.boardQueue, // old board, taken from the old board "cache".
      // this will initially be the starting board.
    );

    //Push proof to our queue!
    this.proofQueue.push(proof);

    //Print the proof.
    if (this.dispatch) {
      this.dispatch({
        type: "SEND_PROOF",
        payload: {
          proof: proofJSON,
        },
      });
    }

    //TODO: this isn't true if we have other workers still processing.
    //      Perhaps a token-based approach, where we pop a value onto
    //      an array, then pop it off once we're finished working?
    //      An empty array would indicate all tasks are finished.
    this.isProcessing = false;

    return proof;
  }*/

  //Add a move to the moveQueue. We push the new board to currentBoard.
  async addMove(zkBoard: GameBoardWithSeed, move: string) {
    console.log("Adding move to queue", zkBoard, move);
    console.log("Active worker count", this.workersProcessing);
    this.moveQueue.push(move);
    this.boardQueue.push(zkBoard);
    console.log("Move added to queue: ", this.moveQueue.length);
  }
}
