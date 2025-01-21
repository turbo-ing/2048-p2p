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
    baseCase: {
      privateInputs: [BoardArray, Direction],

      async method(boards: BoardArray, directions: Direction) {
        //console.debug("27");
        let initBoard = boards.value[0];
        let newBoard = boards.value[1];
        //console.debug("30");
        let currentBoard = initBoard.board;
        let currentSeed = initBoard.seed;
        //console.debug("33");
        for (let i = 0; i < MAX_MOVES2; i++) {
          let nextBoard = applyOneMoveCircuit(
            currentBoard,
            directions.value[i],
          );
          let needAddTile = nextBoard.hash().equals(currentBoard.hash()).not();
          //console.debug("40");
          currentBoard = nextBoard;
          [currentBoard, currentSeed] = addRandomTile(
            currentBoard,
            currentSeed,
            needAddTile,
          );
        }
        //console.debug("48");
        for (let j = 0; j < 16; j++) {
          console.log("Cells debugging:");
          console.log(j);
          console.log(boards.value);
          console.debug(currentBoard.cells[j]);
          console.debug(newBoard.board.cells[j]);
          currentBoard.cells[j].assertEquals(newBoard.board.cells[j]);
        }
        //console.debug("52");
        newBoard.seed.assertEquals(currentSeed);
        console.log(newBoard.seed);
        console.log(currentSeed);
        //console.debug("54");
        return { publicOutput: boards };
      },
    },
    /**
     * Inductive Step: Recursively verifies groups of proofs by comparing their
     * initial and terminal states to verify that there is a continuous transition
     * between them (eg A->E, E->I. We compare E, E and return proof that A->I).
     */
    inductiveStep: {
      privateInputs: [SelfProof, SelfProof],

      async method(
        proof1: SelfProof<void, BoardArray>,
        proof2: SelfProof<void, BoardArray>,
      ) {
        //verify both earlier proofs
        proof1.verify();
        proof2.verify();

        //Get both boards from the proofs
        const proof1board1 = proof1.publicOutput.value[0];
        const proof1board2 = proof1.publicOutput.value[1];
        const proof2board1 = proof2.publicOutput.value[0];
        const proof2board2 = proof2.publicOutput.value[1];

        //console.debug(proof1board1.seed);
        //console.debug(proof1board2.seed);
        //console.debug(proof2board1.seed);
        //console.debug(proof2board2.seed);

        //compare seeds
        proof1board2.seed.assertEquals(proof2board1.seed);
        console.log(proof1board2.seed);
        console.log(proof2board1.seed);

        //compare cells
        for (let c = 0; c < 16; c++) {
          proof1board2.board.cells[c].assertEquals(proof2board1.board.cells[c]);
        }

        //construct new BoardArray capturing the fact that we now have a proof for A->C from A->B, B->C
        let retArray = new BoardArray([proof1board1, proof2board2]);

        return { publicOutput: retArray };
      },
    },
  },
});
