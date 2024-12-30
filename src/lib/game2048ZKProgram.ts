import { SelfProof, ZkProgram } from "o1js";

import { applyOneMoveCircuit, Direction, GameBoard } from "./game2048ZKLogic";

export const Game2048ZKProgram = ZkProgram({
  name: "Game2048ZKProgram",
  publicInput: GameBoard,

  methods: {
    initialize: {
      privateInputs: [],

      async method(input: GameBoard) {
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
        newBoard: GameBoard,
        earlierProof: SelfProof<GameBoard, void>,
        directions: Direction,
      ) {
        earlierProof.verify();

        let currentBoard = earlierProof.publicInput;

        for (let i = 0; i < directions.value.length; i++) {
          currentBoard = applyOneMoveCircuit(currentBoard, directions.value[i]);
        }

        for (let j = 0; j < 16; j++) {
          currentBoard.cells[j].assertEquals(newBoard.cells[j]);
        }
      },
    },
  },
});
