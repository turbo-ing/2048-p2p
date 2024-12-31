import { SelfProof, ZkProgram } from "o1js";

import {
  addRandomTile,
  applyOneMoveCircuit,
  Direction,
  GameBoardWithSeed,
} from "./game2048ZKLogic";

export const Game2048ZKProgram = ZkProgram({
  name: "Game2048ZKProgram",
  publicInput: GameBoardWithSeed,

  methods: {
    initialize: {
      privateInputs: [],

      async method(input: GameBoardWithSeed) {
        // Do not need to do anything here
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

        for (let i = 0; i < directions.value.length; i++) {
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
      },
    },
  },
});
