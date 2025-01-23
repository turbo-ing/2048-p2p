import { Provable, ZkProgram, SelfProof, provable } from "o1js";

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
    baseistCase: {
      privateInputs: [GameBoardWithSeed],

      async method(input: GameBoardWithSeed) {
        //Provable.log(input);
        //Provable.log("initialize", input);
        let retArray = new BoardArray([input, input]);
        return { publicOutput: retArray };
      },
    },
    /**
     * Base Case: Generate a proof of state transition between two arbitrary
     * board states, given a list of direction and the two states in question.
     */
    baseCase: {
      privateInputs: [BoardArray, Direction],

      async method(boards: BoardArray, directions: Direction) {
        //Provable.log("Start:");
        //Provable.log(boards);

        //Provable.log("30");
        let initBoard = boards.value[0];
        let newBoard = boards.value[1];
        //Provable.log("33");
        let currentBoard = initBoard.getBoard();
        let currentSeed = initBoard.getSeed();

        //Provable.log("Init board", initBoard);
        //Provable.log("Current Board", currentBoard);
        //Provable.log("Current seed", currentSeed);
        //Provable.log("40");
        Provable.log("Applying moves. Where's the deviation?");
        for (let i = 0; i < MAX_MOVES2; i++) {
          Provable.log("Index " + i + ":");
          Provable.log(currentBoard.cells);
          Provable.log(directions.value[i]);
          let nextBoard = applyOneMoveCircuit(
            currentBoard,
            directions.value[i],
          );

          //Provable.log("verifyTransition - nextBoard", nextBoard);
          //Provable.log("verifyTransition - currentBoard", currentBoard);
          //Provable.log("verifyTransition - currentSeed", currentSeed);

          let needAddTile = nextBoard.hash().equals(currentBoard.hash()).not();
          //Provable.log("52");
          currentBoard = nextBoard;
          [currentBoard, currentSeed] = addRandomTile(
            currentBoard,
            currentSeed,
            needAddTile,
          );
        }
        Provable.log(currentBoard);
        //Provable.log("60");
        Provable.log("What's the square it's failing on?");
        for (let j = 0; j < 16; j++) {
          Provable.log("Index " + j + ":");
          Provable.log(currentBoard);
          Provable.log(newBoard.board);
          //Provable.log("Cells debugging:");
          //Provable.log(j);
          //Provable.log(directions.value);
          //Provable.log(boards.value);
          //Provable.log(newBoard.board.cells);
          //Provable.log(currentBoard.cells);
          //Provable.log(currentBoard.cells[j]);
          //Provable.log(newBoard.board.cells[j]);
          currentBoard.cells[j].assertEquals(newBoard.board.cells[j]);
        }
        //console.debug("52");
        newBoard.seed.assertEquals(currentSeed);
        // console.log(newBoard.seed);
        // console.log(currentSeed);
        //console.debug("54");
        //Provable.log("End.");
        //Provable.log(boards);
        //Provable.log(boards.value[0]);
        //Provable.log(boards.value[1]);
        return { publicOutput: boards };
      },
    },
    /**
     * Inductive Step: Recursively verifies groups of proofs by comparing their
     * initial and terminal states to verify that there is a continuous transition
     * between them (eg A->E, E->I. We compare E, E and return proof that A->I).
     */
    inductiveStep: {
      privateInputs: [
        SelfProof,
        GameBoardWithSeed,
        GameBoardWithSeed,
        SelfProof,
        GameBoardWithSeed,
        GameBoardWithSeed,
      ],

      async method(
        proof1: SelfProof<void, BoardArray>,
        proof1board1: GameBoardWithSeed,
        proof1board2: GameBoardWithSeed,
        proof2: SelfProof<void, BoardArray>,
        proof2board1: GameBoardWithSeed,
        proof2board2: GameBoardWithSeed,
      ) {
        Provable.log(proof1);
        Provable.log(proof2);
        //verify both earlier proofs
        proof1.verify();
        proof2.verify();

        //const proof1board1 = proof1.publicOutput.value[0];
        //const proof1board2 = proof1.publicOutput.value[1];
        //const proof2board1 = proof2.publicOutput.value[0];
        //const proof2board2 = proof2.publicOutput.value[1];

        //console.debug(proof1board1.seed);
        //console.debug(proof1board2.seed);
        //console.debug(proof2board1.seed);
        //console.debug(proof2board2.seed);

        //compare seeds
        proof1board2.seed.assertEquals(proof2board1.seed);
        //Provable.log(proof1board2.getSeed());
        //Provable.log(proof2board1.getSeed());

        //compare cells
        for (let c = 0; c < 16; c++) {
          proof1board2.board.cells[c].assertEquals(proof2board1.board.cells[c]);
        }

        //Provable.log("Output from zk program:");
        //Provable.log(proof1board1);
        //Provable.log(proof2board2);
        //construct new BoardArray capturing the fact that we now have a proof for A->C from A->B, B->C
        let retArray = new BoardArray([proof1board1, proof2board2]);

        return { publicOutput: retArray };
      },
    },
  },
});
