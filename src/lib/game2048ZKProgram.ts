import { Provable, SelfProof, ZkProgram } from "o1js";

import {
  addRandomTile,
  addRandomTile2,
  applyOneMoveCircuit,
  applyOneMoveCircuit2,
  Direction,
  GameBoardWithSeed,
  MAX_MOVES,
} from "./game2048ZKLogic";

export const Game2048ZKProgram = ZkProgram({
  name: "Game2048ZKProgram",
  publicInput: GameBoardWithSeed,

  methods: {
    initialize: {
      privateInputs: [],

      async method(input: GameBoardWithSeed) {
        Provable.log("initialize", input);
      },
    },
    /**
     * verifyTransition:
     *   Ensures oldBoard --(directions in directionBits)--> newBoard
     *   is correct under the 2048 move logic.
     */
    verifyTransition: {
      privateInputs: [SelfProof, Direction],

      async method(
        newBoard: GameBoardWithSeed,
        earlierProof: SelfProof<GameBoardWithSeed, void>,
        directions: Direction,
      ) {
        earlierProof.verify();

        let currentBoard = earlierProof.publicInput.board;
        let currentSeed = earlierProof.publicInput.seed;

        Provable.log("verifyTransition - directions", directions);

        for (let i = 0; i < MAX_MOVES; i++) {
          Provable.log("verifyTransition - currentBoard", currentBoard);
          Provable.log("verifyTransition - currentSeed", currentSeed);
          Provable.log("verifyTransition - directions", directions.value[i]);
          let nextBoard = applyOneMoveCircuit2(
            currentBoard,
            directions.value[i],
          );
          let needAddTile = nextBoard.hash().equals(currentBoard.hash()).not();

          currentBoard = nextBoard;
          [currentBoard, currentSeed] = addRandomTile2(
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
      },
    },
  },
});
