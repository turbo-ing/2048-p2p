"use client";

import * as Comlink from "comlink";
import { Dispatch } from "react";

import {
  GameBoardWithSeed,
  GameBoard,
  MAX_MOVES2,
  MAX_PARALLEL,
  printBoard,
  ProofArray,
  BoardArray,
  myProof,
  ProofWrapper,
} from "../lib/game2048ZKLogic";

import { setNumberOfWorkers, SelfProof, Field, ZkProgram } from "o1js";

import { Action } from "@/reducer/2048";
import { Game2048ZKProgram } from "@/lib/game2048ZKProgram";

export default class ZkClient {
  worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import("./zkWorker").zkWorkerAPI>;

  compiled = false;
  initialising = true;
  workersProcessing = 0;
  moveQueue: string[] = [];
  proofQueue: SelfProof<void, BoardArray>[] = [];

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
      this.worker = new Worker(new URL("./zkWorker.ts", import.meta.url), {
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
      if (this.initialising === true) {
        console.debug("Still initialising, skipping interval");

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

        console.log(proofs[0]);
        console.log(proofs[1]);

        const proofJSON: string = await this.remoteApi.inductiveStep(
          JSON.stringify(proofs[0].toJSON()),
          JSON.stringify(proofs[1].toJSON()),
        );

        console.log("made it to client");

        const proof: SelfProof<void, BoardArray> = await ZkProgram.Proof(
          Game2048ZKProgram,
        ).fromJSON(JSON.parse(proofJSON));
        this.proofQueue.unshift(proof);

        //send proof
        this.dispatch({
          type: "SEND_PROOF",
          payload: {
            proof: proofJSON,
          },
        });

        console.log("Proof queue length: ", this.proofQueue.length);
        console.log("Move queue length: ", this.moveQueue.length);

        this.workersProcessing -= 1;
      } else if (this.moveQueue.length > 0 && this.boardQueue.length > 1) {
        //We want to clear the moveQueue ideally before the proofQueue,
        //unless the latter has a large backlog.

        //console.log("Processing moveQueue");
        this.workersProcessing += 1;

        //We need to firstly check how many boards are in the queue.
        //We know there are 1 < b < n boards.
        //We want to take at most 5 boards and peek at the 6th.
        //Thus, if boards.length < 6:
        //  - we grab boards.length-1 boards and moves, then peek at the boards.length one
        //  eg if we only have 5 boards (4 moves), aka if moves < max_moves,
        //      we would grab 4 boards and 4 moves and peek at the last one.

        //console.log("Generating proof for moveQueue", this.moveQueue);

        //Peel off a section of the moveQueue and boardQueue
        const moves = this.moveQueue.slice(0, MAX_MOVES2);
        const boards = this.boardQueue.slice(0, moves.length);

        //console.log("moves to use in proof: ", moves);

        //Remove those moves/boards from the queue also
        this.moveQueue = this.moveQueue.slice(moves.length);

        this.boardQueue = this.boardQueue.slice(moves.length);

        //replace the last board if we dont have enough boards normally

        //not necessary because I changed it just now
        //this.boardQueue.unshift(boards[boards.length - 1]);

        //console.log("updated moveQueue: ", this.moveQueue);
        // console.log("updated boardQueue: ", this.boardQueue);

        //refer to notes at boardQueuedeclaration
        let initBoard = boards[0];
        let newBoard: GameBoardWithSeed = this.boardQueue[0];

        const boardNums1 = initBoard
          .getBoard() // breaks
          .cells.map((cell) => Number(cell.toBigInt()));
        const seedNum1 = initBoard.getSeed().toBigInt();

        const boardNums2 = newBoard
          .getBoard() // breaks
          .cells.map((cell) => Number(cell.toBigInt()));
        const seedNum2 = newBoard.getSeed().toBigInt();

        /*const [proof, proofJSON]: [SelfProof<void, BoardArray>, string] =
          await this.remoteApi.baseCaseAux(
            boardNums1,
            seedNum1,
            boardNums2,
            seedNum2,
            moves,
          );*/

        const proofJSON: string = await this.remoteApi.baseCaseAux(
          boardNums1,
          seedNum1,
          boardNums2,
          seedNum2,
          moves,
        );

        //this.proofQueue.push(proof);

        //console.log("Pushed proof:");
        //console.log(proof);
        //console.log("Prototype proof:");
        //console.log(Object.getPrototypeOf(proof));
        const proof: SelfProof<void, BoardArray> = await ZkProgram.Proof(
          Game2048ZKProgram,
        ).fromJSON(JSON.parse(proofJSON));

        this.proofQueue.push(proof);

        //send proof
        this.dispatch({
          type: "SEND_PROOF",
          payload: {
            proof: proofJSON,
          },
        });

        console.log("Proof queue length: ", this.proofQueue.length);
        console.log("Move queue length: ", this.moveQueue.length);

        this.workersProcessing -= 1;
      } else if (this.proofQueue.length > 1) {
        console.log("Processing proofQueue (Regular)");
        //We only deal with remaining proofs in the queue if there's nothing else to do.
        //This should be the last step.
        this.workersProcessing += 1;

        //Peel off a section of the proofQueue
        const proofs = this.proofQueue.slice(0, 2);
        this.proofQueue = this.proofQueue.slice(2);

        console.log(proofs[0]);
        console.log(proofs[1]);

        const proofJSON: string = await this.remoteApi.inductiveStep(
          JSON.stringify(proofs[0].toJSON()),
          JSON.stringify(proofs[1].toJSON()),
        );

        console.log("made it to client");

        const proof: SelfProof<void, BoardArray> = await ZkProgram.Proof(
          Game2048ZKProgram,
        ).fromJSON(JSON.parse(proofJSON));
        this.proofQueue.unshift(proof);

        //send proof
        this.dispatch({
          type: "SEND_PROOF",
          payload: {
            proof: proofJSON,
          },
        });

        console.log("Proof queue length: ", this.proofQueue.length);
        console.log("Move queue length: ", this.moveQueue.length);

        this.workersProcessing -= 1;
      }
    }, 500);
  }

  //Add a move to the moveQueue. Likewise with a board.
  async addMove(zkBoard: GameBoardWithSeed, move: string) {
    console.log("Adding move to queue", zkBoard, move);
    console.log("Active worker count", this.workersProcessing);
    this.moveQueue.push(move);
    this.boardQueue.push(zkBoard);
    console.log("Move added to queue: ", move);
    console.log("Board added to queue: ", zkBoard);
  }
  //Adds the initial board to the boardQueue.
  async addBoard(zkBoard: GameBoardWithSeed) {
    this.initialising = true;

    while (!this.compiled) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    console.log("Initializing ZK proof", zkBoard);

    console.log("Adding initial board to queue", zkBoard);
    console.log("Active worker count", this.workersProcessing);

    this.boardQueue.unshift(zkBoard);
    console.log("Board added to queue: ", this.boardQueue.length);
    this.initialising = false;
  }
}
