import { Provable, SelfProof, ZkProgram } from "o1js";

import {
  addRandomTile,
  applyOneMoveCircuit,
  BoardArray,
  Direction,
  GameBoardWithSeed,
  MAX_MOVES2,
  MAX_PARALLEL,
  ProofArray,
} from "./game2048ZKLogic2";

export const Game2048ZKProgram1Million = ZkProgram({
  name: "Game2048ZKProgram1Million",
  publicOutput: BoardArray,

  methods: {
    /**
     * Base Case: Generate a proof of state transition between two arbitrary
     * board states, given a list of direction and the two states in question.
     */
    initialize: {
      privateInputs: [BoardArray, Direction],

      async method(boards: BoardArray, directions: Direction) {
        let initBoard = boards.value[0];
        let newBoard = boards.value[1];

        let currentBoard = initBoard.board;
        let currentSeed = initBoard.seed;

        Provable.log("verifyTransition - directions", directions);

        for (let i = 0; i < MAX_MOVES2; i++) {
          Provable.log("verifyTransition - currentBoard", currentBoard);
          Provable.log("verifyTransition - currentSeed", currentSeed);
          Provable.log("verifyTransition - directions", directions.value[i]);
          let nextBoard = applyOneMoveCircuit(
            currentBoard,
            directions.value[i],
          );
          let needAddTile = nextBoard.hash().equals(currentBoard.hash()).not();

          currentBoard = nextBoard;
          [currentBoard, currentSeed] = addRandomTile(
            currentBoard,
            currentSeed,
            needAddTile,
          );

          Provable.log("verifyTransition - nextBoard", nextBoard);
          Provable.log("verifyTransition - currentBoard - 2", currentBoard);
          Provable.log("verifyTransition - currentSeed - 2", currentSeed);
        }

        for (let j = 0; j < 16; j++) {
          currentBoard.cells[j].assertEquals(newBoard.board.cells[j]);
        }
        Provable.log("verifyTransition - newBoard-seed", newBoard.seed);
        newBoard.seed.assertEquals(currentSeed);
        return { publicOutput: boards };
      },
    },
    /**
     * Inductive Step: Recursively verifies groups of proofs by comparing their
     * initial and terminal states to verify that there is a continuous transition
     * between them (eg A->E, E->I. We compare E, E and return proof that A->I).
     */
    verifyTransition: {
      privateInputs: [ProofArray],

      async method(proofs: ProofArray) {
        //verify all proofs in group
        for (let i = 0; i < MAX_PARALLEL; i++) {
          proofs.value[i].verify();
        }

        //verify all state transitions
        for (let j = 1; j < MAX_PARALLEL; j++) {
          //define current pair of proof boards
          //TODO: have the later board provide its initial board state. Currently, both are providing their final board states, which will always fail.
          let earlierBoard = proofs.value[j - 1].publicOutput.value[1];
          let laterBoard = proofs.value[j].publicInput.value[0];

          //compare seeds
          earlierBoard.board.seed.assertEquals(laterBoard.board.seed[j]);

          //compare cells
          for (let k = 0; k < 16; k++) {
            earlierBoard.board.cells[k].assertEquals(laterBoard.board.cells[k]);
          }
        }

        //construct new BoardArray capturing the fact that we now have a proof for A->Z from {A->B, B->C, ..., Y->Z}

        let retArray = new BoardArray([
          proofs.value[0].publicInput.value[0],
          proofs.value[MAX_PARALLEL - 1].publicInput.value[1],
        ]);

        return { publicOutput: retArray };
      },
    },
  },
});
