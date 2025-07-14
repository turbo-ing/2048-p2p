import { Field, Provable, SelfProof, Signature, UInt8, ZkProgram } from "o1js";

import {
  addRandomTile,
  applyOneMoveCircuit,
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
        // Provable.log("initialize", input);

        // Initial board must not have more than two tiles
        let count = new Field(0);
        for (let i = 0; i < 16; i++) {
          input.board.cells[i].assertLessThanOrEqual(2);
          count = count.add(input.board.cells[i]);
        }
        count.assertLessThanOrEqual(4);
      },
    },
    /**
     * verifyTransition:
     *   Ensures oldBoard --(directions in directionBits)--> newBoard
     *   is correct under the 2048 move logic.
     */
    verifyTransition: {
      privateInputs: [SelfProof, Direction, Signature],

      async method(
        newBoard: GameBoardWithSeed,
        earlierProof: SelfProof<GameBoardWithSeed, void>,
        directions: Direction,
        signature: Signature,
      ) {
        newBoard.initialSeed.assertEquals(earlierProof.publicInput.initialSeed);

        earlierProof.verify();
        earlierProof.publicInput.verifySignature(signature, directions);

        let currentBoard = earlierProof.publicInput.board;
        let currentSeed = earlierProof.publicInput.seed;

        // Provable.log("verifyTransition - directions", directions);

        for (let i = 0; i < MAX_MOVES; i++) {
          // Provable.log("verifyTransition - currentBoard", currentBoard);
          // Provable.log("verifyTransition - currentSeed", currentSeed);
          // Provable.log("verifyTransition - directions", directions.value[i]);
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

          // Provable.log("verifyTransition - nextBoard", nextBoard);
          // Provable.log("verifyTransition - currentBoard - 2", currentBoard);
          // Provable.log("verifyTransition - currentSeed - 2", currentSeed);
        }

        for (let j = 0; j < 16; j++) {
          currentBoard.cells[j].assertEquals(newBoard.board.cells[j]);
        }
        // Provable.log("verifyTransition - newBoard-seed", newBoard.seed);
        newBoard.seed.assertEquals(currentSeed);
        newBoard.sessionKey.assertEquals(earlierProof.publicInput.sessionKey);
      },
    },
  },
});

export class Game2048ZKProgramProof extends ZkProgram.Proof(
  Game2048ZKProgram,
) {}
