import { Provable, ZkProgram, SelfProof } from "o1js";

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

export const Game2048ZKProgram3 = ZkProgram({
  name: "Game2048ZKProgram3",
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
      privateInputs: [SelfProof, SelfProof],

      async method(
        proof1: SelfProof<void, BoardArray>,
        proof2: SelfProof<void, BoardArray>,
      ) {
        //verify both earlier proofs
        proof1.verify();
        proof2.verify();

        //Get both boards from the proofs
        const board1proof1 = proof1.publicOutput.value[0];
        const board2proof1 = proof1.publicOutput.value[1];
        const board1proof2 = proof2.publicOutput.value[0];
        const board2proof2 = proof2.publicOutput.value[1];

        //compare seeds
        board2proof1.seed.assertEquals(board1proof2.seed);

        //compare cells
        for (let c = 0; c < 16; c++) {
          board2proof1.board.cells[c].assertEquals(board1proof2.board.cells[c]);
        }

        //construct new BoardArray capturing the fact that we now have a proof for A->C from A->B, B->C
        let retArray = new BoardArray([board1proof1, board2proof2]);

        return { publicOutput: retArray };
      },
    },
  },
});
