import { Provable, ZkProgram } from "o1js";

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

export const Game2048ZKProgram2 = ZkProgram({
  name: "Game2048ZKProgram2",
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

        for (let i = 0; i < MAX_MOVES2; i++) {
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
        }

        for (let j = 0; j < 16; j++) {
          currentBoard.cells[j].assertEquals(newBoard.board.cells[j]);
        }

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
        if (proofs.value.length === 1) {
          proofs.value[0].proof.verify;
          return { publicOutput: proofs.value[0].proof.publicOutput };
        }

        //verify all proofs in group
        for (let i = 0; i < MAX_PARALLEL; i++) {
          proofs.value[i].proof.verify();
        }

        //verify all state transitions
        for (let j = 1; j < MAX_PARALLEL; j++) {
          //define current pair of proof boards
          //TODO: have the later board provide its initial board state. Currently, both are providing their final board states, which will always fail.
          let earlierBoard = proofs.value[j - 1].proof.publicOutput.value[1];
          let laterBoard = proofs.value[j].proof.publicOutput.value[0];

          //compare seeds
          earlierBoard.board.seed.assertEquals(laterBoard.board.seed[j]);

          //compare cells
          for (let c = 0; c < 16; c++) {
            earlierBoard.board.cells[c].assertEquals(laterBoard.board.cells[c]);
          }
        }

        //construct new BoardArray capturing the fact that we now have a proof for A->Z from {A->B, B->C, ..., Y->Z}

        let retArray = new BoardArray([
          proofs.value[0].proof.publicOutput.value[0],
          proofs.value[MAX_PARALLEL - 1].proof.publicOutput.value[1],
        ]);

        return { publicOutput: retArray };
      },
    },
  },
});
