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

import { setNumberOfWorkers, SelfProof } from "o1js";

import { Action } from "@/reducer/2048";

export default class ZkClient3 {
  worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import("./zkWorker3").zkWorkerAPI3>;

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
  boardQueue: GameBoardWithSeed[] = [];

  intervalId: number | null = null;
  dispatch: Dispatch<Action>;

  constructor() {
    //setNumberOfWorkers(1);
    // Initialize the worker from the zkWorker
    // TODO: Maybe create a set of workers? For parallelisation.
    if (typeof window !== "undefined") {
      this.worker = new Worker(new URL("./zkWorker3.ts", import.meta.url), {
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
    console.log("Beginning compile");
    const result = await this.remoteApi.compileZKProgram();
    this.compiled = true;
    console.log("Compiled ZK program");
    return result;
  }

  startInterval() {
    this.intervalId = window.setInterval(async () => {
      /*
      console.debug("Current zkClient state:");
      console.log("Compiled: " + this.compiled);
      console.log("Workers processing: " + this.workersProcessing);
      console.debug("Queues: (move, proof, board)");
      console.log(this.moveQueue);
      console.log(this.proofQueue);
      console.log(this.boardQueue);
      */

      //TODO: look into grabbing necessary data before starting a worker.
      //      nvm it does that anyway i think

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
      } else if (this.proofQueue.length > 2) {
        //Highest priority if we have a lot of proofs remaining. If we can clear the proof queue optimally, then we should do so.
        console.log("Processing proofQueue (Priority)");
        this.workersProcessing += 1;

        //Peel off a section of the proofQueue
        const proofs = this.proofQueue.slice(0, 2);
        this.proofQueue = this.proofQueue.slice(2);

        //Step 1: peel away the boards from the proofs
        const proof0 = proofs[0];
        const proof1 = proofs[1];

        let board0 = proof0.publicOutput.value[1];
        let board1 = proof1.publicOutput.value[0];

        console.log("board0:\n");
        console.debug(board0);
        console.log("board1:\n");
        console.debug(board1);

        console.log(board0.board.cells);
        const boardNums0 = board0.board.cells.map((cell) =>
          Number(cell.toBigInt()),
        );
        const seedNums0 = board0.seed.toBigInt();

        console.log(board0.board.cells);
        const boardNums1 = board1.board.cells.map((cell) =>
          Number(cell.toBigInt()),
        );
        const seedNums1 = board1.seed.toBigInt();

        //TODO fix the inductive step breaking
        const [proof, proofJSON] = await this.remoteApi.inductiveStepAux(
          proofs[0],
          boardNums0,
          seedNums0,
          proofs[1],
          boardNums1,
          seedNums1,
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
      } else if (this.moveQueue.length > 0 && this.boardQueue.length > 1) {
        //We want to clear the moveQueue ideally before the proofQueue,
        //unless the latter has a large backlog.

        console.log("Processing moveQueue");
        this.workersProcessing += 1;

        console.log("Generating proof for moveQueue", this.moveQueue);

        //Peel off a section of the moveQueue and boardQueue
        const moves = this.moveQueue.slice(0, MAX_MOVES2);
        const boards = this.boardQueue.slice(0, MAX_MOVES2);

        console.log("moves to use in proof: ", moves);

        //Remove those moves/boards from the queue also
        this.moveQueue = this.moveQueue.slice(MAX_MOVES2);
        this.boardQueue = this.boardQueue.slice(MAX_MOVES2);
        console.log("updated moveQueue: ", this.moveQueue);
        console.log("updated boardQueue: ", this.boardQueue);

        //replace the last board if we dont have enough boards normally
        this.boardQueue.push(boards[boards.length - 1]);

        //refer to notes at boardQueuedeclaration
        let initBoard = boards[0];
        let newBoard = boards[boards.length - 1];

        console.log("initBoard: " + initBoard);
        console.log("newBoard: " + newBoard);

        const boardNums0 = initBoard.board.cells.map((cell) =>
          Number(cell.toBigInt()),
        );
        const seedNums0 = initBoard.seed.toBigInt();

        //TODO error here??
        const boardNums1 = newBoard.board.cells.map((cell) =>
          Number(cell.toBigInt()),
        );
        const seedNums1 = newBoard.seed.toBigInt();

        const [proof, proofJSON] = await this.remoteApi.baseCaseAux(
          boardNums0,
          seedNums0,
          boardNums1,
          seedNums1,
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
      } else if (this.proofQueue.length > 1) {
        console.log("Processing proofQueue (Regular)");
        //We only deal with remaining proofs in the queue if there's nothing else to do.
        //This should be the last step.
        this.workersProcessing += 1;

        //Peel off a section of the proofQueue
        const proofs = this.proofQueue.slice(0, 2);
        this.proofQueue = this.proofQueue.slice(2);

        const proof0 = proofs[0];
        const proof1 = proofs[1];

        let board0 = proof0.publicOutput.value[1];
        let board1 = proof1.publicOutput.value[0];

        console.log("board0:\n");
        console.debug(board0);
        console.log("board1:\n");
        console.debug(board1);

        const boardNums0 = board0.board.cells.map((cell) =>
          Number(cell.toBigInt()),
        );
        const seedNums0 = board0.seed.toBigInt();

        const boardNums1 = board1.board.cells.map((cell) =>
          Number(cell.toBigInt()),
        );
        const seedNums1 = board1.seed.toBigInt();

        //TODO fix the inductive step breaking
        const [proof, proofJSON] = await this.remoteApi.inductiveStepAux(
          proofs[0],
          boardNums0,
          seedNums0,
          proofs[1],
          boardNums1,
          seedNums1,
        );

        await this.proofQueue.push(proof);

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

  //Add a move to the moveQueue. Likewise with a board.
  async addMove(zkBoard: GameBoardWithSeed, move: string) {
    console.log("Adding move to queue", zkBoard, move);
    console.log("Active worker count", this.workersProcessing);
    await this.moveQueue.push(move);
    await this.boardQueue.push(zkBoard);
    console.log("Move added to queue: ", this.moveQueue.length);
    console.log("Board added to queue: ", this.boardQueue.length);
  }
  //Adds the initial board to the boardQueue.
  async addBoard(zkBoard: GameBoardWithSeed) {
    console.log("Adding initial board to queue", zkBoard);
    console.log("Active worker count", this.workersProcessing);
    await this.boardQueue.push(zkBoard);
    console.log("Board added to queue: ", this.boardQueue.length);
  }
}
