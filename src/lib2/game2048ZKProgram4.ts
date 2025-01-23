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

export const Game2048ZKProgram4 = ZkProgram({
  name: "Game2048ZKProgram4",
  publicInput: Provable.Array(GameBoardWithSeed, 2),
  //publicOutput: BoardArray,

  methods: {
    /*baseistCase: {
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
      privateInputs: [Direction],

      async method(
        boards: [GameBoardWithSeed, GameBoardWithSeed],
        //newBoard: GameBoardWithSeed,
        directions: Direction,
      ) {
        //Provable.log("Start:");
        //Provable.log(boards);

        //Provable.log("30");
        let initBoard = boards[0];
        let newBoard = boards[1];
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

          currentBoard.cells[j].assertEquals(newBoard.board.cells[j]);
        }
        //console.debug("52");
        newBoard.seed.assertEquals(currentSeed);
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
        boards: [GameBoardWithSeed, GameBoardWithSeed],
        proof1: SelfProof<[GameBoardWithSeed, GameBoardWithSeed], void>,
        //proof1board1: GameBoardWithSeed,
        //proof1board2: GameBoardWithSeed,
        proof2: SelfProof<[GameBoardWithSeed, GameBoardWithSeed], void>,
        //proof2board1: GameBoardWithSeed,
        //proof2board2: GameBoardWithSeed,
      ) {
        //return { publicOutput: ra };
        Provable.log(proof1);
        Provable.log(proof2);
        //verify both earlier proofs
        proof1.verify();
        proof2.verify();

        Provable.log("Verified both proofs.");

        const proof1board1 = proof1.publicInput[0];
        const proof1board2 = proof1.publicInput[1];
        const proof2board1 = proof2.publicInput[0];
        const proof2board2 = proof2.publicInput[1];

        //console.debug(proof1board1.seed);
        //console.debug(proof1board2.seed);
        //console.debug(proof2board1.seed);
        //console.debug(proof2board2.seed);

        //compare seeds
        proof1board2.seed.assertEquals(proof2board1.seed);
        //Provable.log(proof1board2.getSeed());
        //Provable.log(proof2board1.getSeed());

        Provable.log("Verified both seeds.");

        //compare cells
        for (let c = 0; c < 16; c++) {
          proof1board2.board.cells[c].assertEquals(proof2board1.board.cells[c]);
        }

        Provable.log("Verified all cells.");

        //Provable.log("Output from zk program:");
        //Provable.log(proof1board1);
        //Provable.log(proof2board2);
        //construct new BoardArray capturing the fact that we now have a proof for A->C from A->B, B->C
        const boardArr = [proof1board1, proof2board2];
        const retArray = new BoardArray(boardArr);
        Provable.log(boardArr);

        Provable.log("Created return array.");
        Provable.log(retArray);
      },
    },
  },
});
