import * as Comlink from "comlink";

import {
  SelfProof,
  VerificationKey,
  Field,
  Proof,
  ZkProgram,
  JsonProof,
  setNumberOfWorkers,
} from "o1js";

import {
  BoardArray,
  GameBoard,
  GameBoardWithSeed,
  MAX_MOVES2,
  MAX_PARALLEL,
} from "../lib/game2048ZKLogic";
import { Game2048ZKProgram } from "../lib/game2048ZKProgram";
import { Dispatch } from "react";
import { Action } from "@/reducer/2048";

export default class ZkClient2 {
  compiling = false;
  compiled = false;
  initialising = true;
  workersProcessing = 0;
  moveQueue: string[] = [];
  stateQueue: GameBoardWithSeed[] = [];
  proofQueue: SelfProof<void, BoardArray>[] = [];
  proofQueue2: SelfProof<void, BoardArray>[][] = [];
  initialState: number = 0;
  key: VerificationKey | undefined = undefined;

  intervalId: number | null = null;
  dispatch: Dispatch<Action>;

  setKey(vkey: VerificationKey | undefined) {
    this.key = vkey;
  }

  setDispatch(dispatch: Dispatch<Action>) {
    this.dispatch = dispatch;
  }

  getScore(board: GameBoard) {
    var score = 0;
    for (let i = 0; i < board.cells.length; i++) {
      let cellValue = Number(board.cells[i].toBigInt());
      if (cellValue !== 0) {
        score += (cellValue - 1) * Math.pow(2, cellValue);
      }
    }
    return score;
  }

  //TODO add score to circuit so we can use for this
  compareProofs(
    proof1: SelfProof<void, BoardArray>,
    proof2: SelfProof<void, BoardArray>,
  ) {
    const board1 = proof1.publicOutput.value[0].getBoard();
    const board2 = proof2.publicOutput.value[0].getBoard();
    console.log(board1);
    console.log(board2);

    var score1 = 0;
    for (let i = 0; i < board1.cells.length; i++) {
      let cellValue = Number(board1.cells[i].toBigInt());
      if (cellValue !== 0) {
        score1 += (cellValue - 1) * Math.pow(2, cellValue);
      }
    }

    var score2 = 0;
    for (let i = 0; i < board2.cells.length; i++) {
      let cellValue = Number(board2.cells[i].toBigInt());
      if (cellValue !== 0) {
        score2 += (cellValue - 1) * Math.pow(2, cellValue);
      }
    }

    if (score1 < score2) {
      return -1;
    }
    if (score1 > score2) {
      return 1;
    }
    return 0;
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.startInterval();
    }
  }

  startInterval() {
    this.intervalId = window.setInterval(async () => {
      //clean up
      for (let p = 0; p < this.proofQueue2.length; p++) {
        let indexes: number[] = [];
        if (this.proofQueue[p] !== undefined) {
          for (let i = 0; i < this.proofQueue2[p].length; i++) {
            if (this.proofQueue2[p][i] === undefined) {
              indexes.push(i);
            }
          }
          for (let i = 0; i < indexes.length; i++) {
            this.proofQueue2.splice(i, 1);
          }
        }
      }

      console.log("-------ProofQueue2:---------");
      for (let p = 0; p < this.proofQueue2.length; p++) {
        console.log(
          "Layer " + p + ": ",
          this.proofQueue2[p].length,
          this.proofQueue2[p],
        );
      }
      console.log("----------------------------");
      console.log("-------MoveQueue:---------");
      console.log(this.moveQueue.length, this.moveQueue);
      console.log("----------------------------");
      console.log("-------StateQueue:---------");
      console.log(this.stateQueue.length, this.stateQueue);
      console.log("----------------------------");
      console.log("-------Workers processing:---------");
      console.log(this.workersProcessing);
      console.log("----------------------------");
      let lowPriority = false;
      let highPriority = false;
      let indexes: number[] = [];
      for (let p = 0; p < this.proofQueue2.length; p++) {
        if (this.proofQueue2[p].length > 1) {
          if (this.proofQueue2[p].length > 2) highPriority = true;
          else lowPriority = true;
          indexes = [p, p];
          break;
        }
      }
      if (!lowPriority && !highPriority) {
        //No proofqueues more than 2 long
        for (let p = 0; p < this.proofQueue2.length; p++) {
          if ((this.proofQueue2[p].length = 1)) {
            if (indexes[0] !== undefined) {
              if (this.proofQueue2[p][0] !== undefined) {
                indexes[1] = p; //We can clean up scraggler
                lowPriority = true;
                break;
              } else {
                this.proofQueue2[p].shift();
              }
            } else {
              if (this.proofQueue2[p][0] !== undefined)
                indexes[0] = p; //See if we can clean up the scraggler
              else this.proofQueue2[p].shift();
            }
          }
        }
      }
      console.log("pre-ifs");

      if (this.initialising === true) {
        console.log("Still initialising, skipping interval");

        return;
      }
      if (this.workersProcessing == MAX_PARALLEL) {
        console.log("All workers processing, skipping interval");

        return;
      }
      if (
        this.moveQueue.length === 0 &&
        !highPriority &&
        !lowPriority && //this.proofQueue.length < 2 &&
        this.workersProcessing == 0
      ) {
        console.log(
          "No moves to process and no active workers, skipping interval",
        );

        return;
      } else if (highPriority) {
        //this.proofQueue.length > 2) {
        //Highest priority if we have a lot of proofs remaining. If we can clear the proof queue optimally, then we should do so.
        console.log("Processing proofQueue (Priority)");
        this.workersProcessing += 1;
        let proofs: SelfProof<void, BoardArray>[] = [];
        let success = false;
        for (let i = 0; i < this.proofQueue2[indexes[1]].length - 2; i++) {
          proofs = this.proofQueue2[indexes[1]].slice(i, i + 2);
          const board1 = proofs[0].publicOutput.value[1].board;
          const board2 = proofs[1].publicOutput.value[0].board;
          if (this.getScore(board1) === this.getScore(board2)) {
            if (i === 0) {
              this.proofQueue2[indexes[1]] =
                this.proofQueue2[indexes[1]].slice(2);
            } else {
              this.proofQueue2[indexes[1]] = this.proofQueue2[indexes[1]]
                .slice(0, i)
                .concat(this.proofQueue2[indexes[1]].slice(i + 2));
            }
            success = true;
            if (this.proofQueue2[indexes[1]] === undefined) {
              this.proofQueue2[indexes[1]] = [];
            }
            break;
          }
        }
        if (!success) {
          console.log("No consecutive proofs to reduce.");
          this.workersProcessing -= 1;
          return;
        }
        /*
                let proofs : SelfProof<States, States>[] = [];
                let success = false;
                for(let i=0; i<this.proofQueue.length-2; i++){
                    proofs = this.proofQueue.slice(i, (i+2));
                    const n1 = proofs[0].publicInput.state2.toBigInt();
                    const n2 = proofs[1].publicInput.state1.toBigInt();
                    if(n1 === n2) {
                        if(i === 0){
                            this.proofQueue = this.proofQueue.slice(2);
                        } else {
                            this.proofQueue = this.proofQueue.slice(0, i).concat(this.proofQueue.slice(i+2));
                        }
                        success = true;
                        break;
                    }
                }
                if(!success) return;
                */

        //Peel off a section of the proofQueue
        //const proofs = this.proofQueue.slice(0, 2);
        //this.proofQueue = this.proofQueue.slice(2);
        //const proofs = this.proofQueue2[index].slice(0,2);
        //this.proofQueue2[index] = this.proofQueue2[index].slice(2);

        console.log("Fetching proof [Inductive, priority]:");
        fetch("http://localhost:4001/inductiveStep", {
          // Adding method type
          method: "POST",

          // Adding body or contents to send
          body: JSON.stringify({
            proof1: JSON.stringify(proofs[0].toJSON()),
            proof2: JSON.stringify(proofs[1].toJSON()),
          }),

          // Adding headers to the request
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
            "Content-Type": "application/json; charset=UTF-8",
          },
        })
          .then((response) => response.json())
          .then(async (json) => {
            console.log(json.proofJSON);

            console.log("pre3");
            const proof = await ZkProgram.Proof(Game2048ZKProgram).fromJSON(
              JSON.parse(json.proofJSON),
            );
            console.log("post");
            //send proof
            this.dispatch({
              type: "SEND_PROOF",
              payload: {
                proof: json.proofJSON,
              },
            });
            //const proofb = JSON.parse(proofJSON).fromJSON();

            const newIndex = indexes[1] + 1;
            if (this.proofQueue2[newIndex] === undefined) {
              this.proofQueue2[newIndex] = [];
            }
            this.proofQueue2[newIndex].push(proof);
            this.proofQueue2[newIndex].sort(this.compareProofs);

            //this.proofQueue.push(proof);
            //this.proofQueue.sort(this.compareProofs);
            console.log("Generated proof");
            //console.log(json.proofJSON);

            this.workersProcessing -= 1;
          });
      } else if (this.moveQueue.length > 0) {
        //if we have moves, we want to get rid of the moves
        console.log("Processing moveQueue");
        this.workersProcessing += 1;

        //Peel off a section of the moveQueue and boardQueue
        const moves = this.moveQueue.slice(0, MAX_MOVES2);
        const states = this.stateQueue.slice(0, moves.length);

        //console.log("moves to use in proof: ", moves);

        //Remove those moves/boards from the queue also
        this.moveQueue = this.moveQueue.slice(moves.length);

        this.stateQueue = this.stateQueue.slice(moves.length);

        //replace the last board if we dont have enough boards normally

        //not necessary because I changed it just now
        //this.boardQueue.unshift(boards[boards.length - 1]);

        //console.log("updated moveQueue: ", this.moveQueue);
        // console.log("updated boardQueue: ", this.boardQueue);

        let initBoard = states[0];
        let newBoard: GameBoardWithSeed = this.stateQueue[0];

        const boardNums1 = initBoard
          .getBoard() // breaks
          .cells.map((cell) => Number(cell.toBigInt()));
        const seedNum1 = initBoard.getSeed().toBigInt();

        const boardNums2 = newBoard
          .getBoard() // breaks
          .cells.map((cell) => Number(cell.toBigInt()));
        const seedNum2 = newBoard.getSeed().toBigInt();
        /*const initState = states[0];
        const newState: number = this.stateQueue[0];
        console.log(initState);
        console.log(newState);*/

        console.log("Fetching proof: [Base]");
        fetch("http://localhost:4001/baseCase", {
          // Adding method type
          method: "POST",

          // Adding body or contents to send
          body: JSON.stringify({
            boardNums0: boardNums1,
            seedNum0: seedNum1.toString(),
            boardNums1: boardNums2,
            seedNum1: seedNum2.toString(),
            moves: moves,
          }),

          // Adding headers to the request
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
            "Content-Type": "application/json; charset=UTF-8",
          },
        })
          .then((response) => response.json())
          .then(async (json) => {
            console.log(json.proofJSON);

            console.log("pre3");
            const proof = await ZkProgram.Proof(Game2048ZKProgram).fromJSON(
              JSON.parse(json.proofJSON),
            );
            console.log("post");
            //send proof
            this.dispatch({
              type: "SEND_PROOF",
              payload: {
                proof: json.proofJSON,
              },
            });

            console.log("received proof.");
            //const proofb = JSON.parse(proofJSON).fromJSON();
            if (this.proofQueue2[0] === undefined) {
              this.proofQueue2[0] = [];
            }
            this.proofQueue2[0].push(proof);
            this.proofQueue2[0].sort(this.compareProofs);
            //this.proofQueue.push(proof);
            //this.proofQueue.sort(this.compareProofs);
            console.log("Generated proof");
            //console.log(json.proofJSON);

            this.workersProcessing -= 1;
          });
      } else if (lowPriority) {
        //this.proofQueue.length > 1) {
        console.log("Processing proofQueue (Regular)");
        //We only deal with remaining proofs in the queue if there's nothing else to do.
        //This should be the last step.
        this.workersProcessing += 1;
        let proofs: SelfProof<void, BoardArray>[] = [];
        let success = false;
        if (indexes[0] === indexes[1]) {
          proofs = this.proofQueue2[indexes[1]].slice(0, 2);
          const board1 = proofs[0].publicOutput.value[1].board;
          const board2 = proofs[1].publicOutput.value[0].board;
          if (this.getScore(board1) === this.getScore(board2)) {
            this.proofQueue2[indexes[1]] =
              this.proofQueue2[indexes[1]].slice(2);
            if (this.proofQueue2[indexes[1]] === undefined) {
              this.proofQueue2[indexes[1]] = [];
            }
            success = true;
          }
        } else {
          // cleaning up scraggley proofs
          proofs[0] = this.proofQueue2[indexes[1]][0]; //not a typo. lower-level proofs in the end are always late
          proofs[1] = this.proofQueue2[indexes[0]][0];
          console.log(proofs[0]);
          console.log(proofs[1]);
          const board1 = proofs[0].publicOutput.value[1].board;
          const board2 = proofs[1].publicOutput.value[0].board;
          if (this.getScore(board1) === this.getScore(board2)) {
            this.proofQueue2[indexes[0]] = [];
            this.proofQueue2[indexes[1]] = [];
            success = true;
          }
        }

        if (!success) {
          console.log("No consecutive proofs to reduce.");
          this.workersProcessing -= 1;
          return;
        }
        //Peel off a section of the proofQueue
        //const proofs = this.proofQueue.slice(0, 2);
        //this.proofQueue = this.proofQueue.slice(2);

        console.log("Fetching proof [Inductive, regular]:");
        fetch("http://localhost:4001/inductiveStep", {
          // Adding method type
          method: "POST",

          // Adding body or contents to send
          body: JSON.stringify({
            proof1: JSON.stringify(proofs[0].toJSON()),
            proof2: JSON.stringify(proofs[1].toJSON()),
          }),

          // Adding headers to the request
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
            "Content-Type": "application/json; charset=UTF-8",
          },
        })
          .then((response) => response.json())
          .then(async (json) => {
            console.log(json.proofJSON);

            console.log("pre3");
            const proof = await ZkProgram.Proof(Game2048ZKProgram).fromJSON(
              JSON.parse(json.proofJSON),
            );
            console.log("post");
            //send proof
            this.dispatch({
              type: "SEND_PROOF",
              payload: {
                proof: json.proofJSON,
              },
            });

            console.log("received proof.");
            //const proofb = JSON.parse(proofJSON).fromJSON();

            const newIndex = indexes[1] + 1;
            if (this.proofQueue2[newIndex] === undefined) {
              this.proofQueue2[newIndex] = [];
            }
            this.proofQueue2[newIndex].push(proof);
            this.proofQueue2[newIndex].sort(this.compareProofs);

            //this.proofQueue.push(proof);
            //this.proofQueue.sort(this.compareProofs);
            console.log("Generated proof");
            //console.log(json.proofJSON);

            this.workersProcessing -= 1;
          });
      } else if (this.workersProcessing > 0) {
        console.log(
          "Workers currently processing: " +
            this.workersProcessing +
            "/" +
            MAX_PARALLEL,
        );
      } else {
        console.log("We shouldn't be here.");
        console.log("queued states: " + this.stateQueue.length);
        console.log("queued moves: " + this.moveQueue.length);
        //console.log("queued proofs: "+this.proofQueue.length);
        console.log("workers processing: " + this.workersProcessing);
      }
      console.log("end");
    }, 500);
  }

  //Add a move to the moveQueue. Likewise with a board.
  async addMove(zkBoard: GameBoardWithSeed, move: string) {
    console.log("Adding move to queue", zkBoard, move);
    console.log("Active worker count", this.workersProcessing);
    this.moveQueue.push(move);
    this.stateQueue.push(zkBoard);
    console.log("Move added to queue: ", move);
    console.log("Board added to queue: ", zkBoard);
  }
  //Adds the initial board to the boardQueue.
  async addBoard(zkBoard: GameBoardWithSeed) {
    console.log("Initializing ZK proof", zkBoard);

    console.log("Adding initial board to queue", zkBoard);
    console.log("Active worker count", this.workersProcessing);

    this.stateQueue.unshift(zkBoard);
    console.log("Board added to queue: ", this.stateQueue.length);
    this.initialising = false;
  }
}
