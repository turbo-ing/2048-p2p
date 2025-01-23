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
} from "../lib2/game2048ZKLogic2";

import { setNumberOfWorkers, SelfProof, Field } from "o1js";

import { Action } from "@/reducer/2048";

export default class ZkClient4 {
  worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import("./zkWorker3").zkWorkerAPI3>;

  compiled = false;
  initialising = true;
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

  //function to fully reconstruct a deserialised proof
  async reconstructProof(brokenproof: SelfProof<void, BoardArray>) {
    let maxproofs = brokenproof.maxProofsVerified;
    let proofval = brokenproof.proof;
    let publicinput = undefined;

    let brokenboard1 = brokenproof.publicOutput.value[0];
    let brokenboard2 = brokenproof.publicOutput.value[1];
    let board1 = await this.reconstruct(brokenboard1);
    let board2 = await this.reconstruct(brokenboard2);
    let publicoutput = new BoardArray([board1, board2]);

    const proof = new SelfProof({
      proof: proofval,
      maxProofsVerified: maxproofs,
      publicInput: publicinput,
      publicOutput: publicoutput,
    });
    return proof;
  }

  //function to reconstruct a proof's board with seed such that it will not break
  async reconstruct(brokenboard: GameBoardWithSeed) {
    //structure of broken values: [0, [0, [VALUEn]]]
    const brokencells = brokenboard.board.cells;
    const brokenseed = brokenboard.seed;

    let fixedcells = [];
    for (let cell of brokencells) {
      fixedcells.push(Field.from(await this.extract(cell)));
    }
    let fixedboard = new GameBoard(fixedcells);
    let fixedseed = Field.from(await this.extract(brokenseed));
    return new GameBoardWithSeed({ board: fixedboard, seed: fixedseed });
  }

  async extract(brokenseed: Field): Promise<bigint> {
    const brokenseed1 = brokenseed.value[1];
    const brokenseed2 = brokenseed1 as [number, bigint];
    const bigintseed: bigint = brokenseed2[1];
    const newField = Field.from(bigintseed);
    //console.log(newField);
    return bigintseed;
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

        const [proof, proofJSON]: [SelfProof<void, BoardArray>, string] =
          await this.remoteApi.inductiveStepAux2(proofs[0], proofs[1]);

        console.log("made it to client");

        const reconstructedProof = await this.reconstructProof(proof);
        this.proofQueue.push(reconstructedProof);

        console.log("Pushed reconstructed proof:");
        console.log(reconstructedProof);

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
        console.log(initBoard);
        console.log(newBoard);

        const zkBoard = new GameBoardWithSeed({
          board: new GameBoard(new Array(16).fill(Field.from(0))),
          seed: Field.from(0),
        });
        console.log("THE DEFINITIVE TEST");
        console.log(zkBoard.getBoard());
        console.log(zkBoard.getSeed());
        console.log("-----------------");
        console.log(Field.from(0));
        console.log("-----------------");

        console.log("Trying function on new object pre-crash");
        let initBoard2: GameBoardWithSeed = new GameBoardWithSeed({
          board: initBoard.board,
          seed: initBoard.seed,
        });
        let newBoard2: GameBoardWithSeed = new GameBoardWithSeed({
          board: newBoard.board,
          seed: newBoard.seed,
        });
        //console.log(newBoard2.getBoard());

        console.log("Before crash");
        //console.log(initBoard2.getBoard().cells);
        //console.log(newBoard2.getBoard().cells);

        const boardNums1 = initBoard
          .getBoard() // breaks
          .cells.map((cell) => Number(cell.toBigInt()));
        const seedNum1 = initBoard2.getSeed().toBigInt();

        const boardNums2 = newBoard
          .getBoard() // breaks
          .cells.map((cell) => Number(cell.toBigInt()));
        const seedNum2 = newBoard2.getSeed().toBigInt();

        const [proof, proofJSON]: [SelfProof<void, BoardArray>, string] =
          await this.remoteApi.baseCaseAux(
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

        const reconstructedProof = await this.reconstructProof(proof);
        this.proofQueue.push(reconstructedProof);

        console.log("Pushed reconstructed proof:");
        console.log(reconstructedProof);

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

        const [proof, proofJSON]: [SelfProof<void, BoardArray>, string] =
          await this.remoteApi.inductiveStepAux2(proofs[0], proofs[1]);

        console.log("made it to client");

        const reconstructedProof = await this.reconstructProof(proof);
        this.proofQueue.push(reconstructedProof);

        console.log("Pushed reconstructed proof:");
        console.log(reconstructedProof);

        console.log("Returned arrays from zk program:");
        console.log(proof.publicOutput.value[0]);
        console.log(proof.publicOutput.value[0]);

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

    /*
    console.log(zkBoard.board);
    const boardNums = zkBoard
      .getBoard()
      .cells.map((cell) => Number(cell.toBigInt()));
    const seedNum = zkBoard.getSeed().toBigInt();

    const [proof, proofJSON]: [SelfProof<void, BoardArray>, string] =
      await this.remoteApi.initialise(boardNums, seedNum);

    console.log("hi");

    const reconstructedProof = await this.reconstructProof(proof);
    this.proofQueue.push(reconstructedProof);

    console.log("Pushed reconstructed proof:");
    console.log(reconstructedProof);

    console.log("Returned arrays from zk program initialisation:");
    console.log(proof.publicOutput.value[0]);
    console.log(proof.publicOutput.value[1]);

    //send proof
    this.dispatch({
      type: "SEND_PROOF",
      payload: {
        proof: proofJSON,
      },
    });*/
    await this.boardQueue.unshift(zkBoard);
    console.log("Board added to queue: ", this.boardQueue.length);
    this.initialising = false;
  }
}
