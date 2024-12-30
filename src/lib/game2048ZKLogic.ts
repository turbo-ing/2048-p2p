import { Bool, Field, Poseidon, Provable, Struct } from "o1js";

export const MAX_MOVES = 1;
/* -------------------------------------------------------------------------- */
/*                                  GameBoard                                  */

/* -------------------------------------------------------------------------- */

/**
 * A small helper struct to store a 4x4 board as an array of 16 Fields.
 */
export class GameBoard extends Struct({
  cells: Provable.Array(Field, 16),
}) {
  constructor(cells: Field[]) {
    super({ cells });
  }

  /**
   * Getter for cell at (row, col).
   */
  getCell(row: number, col: number): Field {
    return this.cells[row * 4 + col];
  }

  /**
   * Setter for cell at (row, col).
   */
  setCell(row: number, col: number, value: Field) {
    this.cells[row * 4 + col] = value;
  }

  /**
   * Create a clone of this board, so we can mutate safely.
   */
  clone(): GameBoard {
    const newCells = this.cells.map((c) => c);

    return new GameBoard(newCells);
  }

  /**
   * Returns a Poseidon hash of all 16 cells (if you want a single digest).
   */
  hash(): Field {
    return Poseidon.hash(this.cells);
  }
}

/* -------------------------------------------------------------------------- */
/*                               Move Directions                              */

/* -------------------------------------------------------------------------- */

/**
 * Directions for 2048 as integer values:
 *  - 0 => None
 *  - 1 => Up
 *  - 2 => Down
 *  - 3 => Left
 *  - 4 => Right
 *
 * We'll encode them with 3 bits in a single field if using parseDirections.
 */
export enum MoveDirection {
  None = 0,
  Up = 1,
  Down = 2,
  Left = 3,
  Right = 4,
}

export class Direction extends Struct({
  value: Provable.Array(Field, MAX_MOVES),
}) {
  constructor(value: Field[]) {
    super({ value });
  }
}

/* -------------------------------------------------------------------------- */
/*                          Parsing Move Directions                           */

/* -------------------------------------------------------------------------- */

/**
 * Extract up to `maxMoves` directions from a single Field
 * (treated as up to 256 bits in the circuit).
 *
 * - Each direction uses 3 bits:
 *   000 => None
 *   001 => Up
 *   010 => Down
 *   011 => Left
 *   100 => Right
 *
 * This example slices off bits[0..2] for the first move,
 * bits[3..5] for the second, etc. (lowest bit first).
 */
export function parseDirections(
  directionBitsField: Field,
  maxMoves: number,
): Field[] {
  // Convert to bits (lowest index = least significant bit).
  let bits = directionBitsField.toBits();

  // Create an array of direction Fields
  let directions: Field[] = [];

  for (let i = 0; i < maxMoves; i++) {
    // bits for move i: bits[3*i .. 3*i+2]
    let chunk = bits.slice(3 * i, 3 * i + 3);
    // Convert them to a single Field integer
    // chunk[0] is LSB, chunk[2] is MSB
    // directionVal = chunk[2]*4 + chunk[1]*2 + chunk[0]*1
    let d = Field.from(0);

    d = d
      .add(Field.fromBits([chunk[0]]))
      .add(Field.fromBits([chunk[1]]).mul(2))
      .add(Field.fromBits([chunk[2]]).mul(4));

    directions.push(d);
  }

  return directions;
}

export function parseDirectionsOutsideCircuit(
  directionBits: bigint,
  maxMoves: number,
): number[] {
  const directions: number[] = [];

  for (let i = 0; i < maxMoves; i++) {
    let shift = 3n * BigInt(i);
    let mask = (1n << 3n) - 1n; // 0b111 = 7
    let dir = Number((directionBits >> shift) & mask);

    directions.push(dir);
  }

  return directions;
}

/* -------------------------------------------------------------------------- */
/*                          Circuit-Friendly Merge                            */

/* -------------------------------------------------------------------------- */

/**
 * bubbleZerosLeft:
 * Moves zeros "to the right" by "bubbling" them out from left to right.
 *
 * This is done in a circuit-friendly way: no `if(...)`, but `Circuit.if()`.
 * For a row of length 4, we'll do 3 bubble passes.
 */
function bubbleZerosLeft(row: Field[]): Field[] {
  let r = [...row];

  function bubblePair(leftVal: Field, rightVal: Field) {
    // If leftVal == 0 and rightVal != 0, swap them
    let leftIsZero = leftVal.equals(Field.from(0));
    let outLeft = Provable.if(leftIsZero, rightVal, leftVal);
    let outRight = Provable.if(leftIsZero, leftVal, rightVal);

    return { outLeft, outRight };
  }

  // We'll do 3 passes for a length-4 array
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < 3; i++) {
      let { outLeft, outRight } = bubblePair(r[i], r[i + 1]);

      r[i] = outLeft;
      r[i + 1] = outRight;
    }
  }

  return r;
}

/**
 * Merges two adjacent cells in a 2048 sense:
 *   if a == b && a != 0 => merges into a+a, leftover=0
 *   else => no merge
 */
function mergeTwoCells(a: Field, b: Field) {
  let bothNonZero = a
    .equals(Field.from(0))
    .not()
    .and(b.equals(Field.from(0)).not());
  let areEqual = a.equals(b);
  let canMerge = bothNonZero.and(areEqual);

  let mergedValue = Provable.if(canMerge, a.add(b), a);
  let leftover = Provable.if(canMerge, Field.from(0), b);

  return { mergedValue, leftover };
}

/**
 * mergeRowLeft:
 * - 1) Shift zeros to the right (bubbleZerosLeft)
 * - 2) Merge adjacent pairs
 * - 3) Shift zeros again
 *
 * This is a simplified version that merges pairs (0,1) and (2,3) independently.
 * Real 2048 merges from left to right in sequence, but let's keep it simpler here.
 */
function mergeRowLeft(row: Field[]): Field[] {
  // 1) bubble zeros
  const shifted = bubbleZerosLeft(row);

  // 2) merge pairs
  const pair1 = mergeTwoCells(shifted[0], shifted[1]);
  const pair2 = mergeTwoCells(pair1.leftover, shifted[2]);
  const pair3 = mergeTwoCells(pair2.leftover, shifted[3]);
  let mergedRow = [
    pair1.mergedValue,
    pair2.mergedValue,
    pair3.mergedValue,
    pair3.leftover,
  ];

  // 3) bubble zeros again
  return bubbleZerosLeft(mergedRow);
}

/**
 * applyMoveLeft:
 * merges each row "to the left"
 */
function applyMoveLeft(board: GameBoard): GameBoard {
  let newBoard = board.clone();

  for (let row = 0; row < 4; row++) {
    let rowVals = [
      newBoard.getCell(row, 0),
      newBoard.getCell(row, 1),
      newBoard.getCell(row, 2),
      newBoard.getCell(row, 3),
    ];
    let merged = mergeRowLeft(rowVals);

    for (let col = 0; col < 4; col++) {
      newBoard.setCell(row, col, merged[col]);
    }
  }

  return newBoard;
}

/**
 * applyMoveRight:
 * We can implement by reversing each row, merging left, then reversing back.
 */
function applyMoveRight(board: GameBoard): GameBoard {
  let newBoard = board.clone();

  for (let row = 0; row < 4; row++) {
    // reverse
    let rowVals = [
      newBoard.getCell(row, 3),
      newBoard.getCell(row, 2),
      newBoard.getCell(row, 1),
      newBoard.getCell(row, 0),
    ];
    let merged = mergeRowLeft(rowVals); // because we want "move right"

    // reverse back
    newBoard.setCell(row, 3, merged[0]);
    newBoard.setCell(row, 2, merged[1]);
    newBoard.setCell(row, 1, merged[2]);
    newBoard.setCell(row, 0, merged[3]);
  }

  return newBoard;
}

/**
 * applyMoveUp:
 * We'll transpose columns into rows, reuse mergeRowLeft, transpose back.
 */
function applyMoveUp(board: GameBoard): GameBoard {
  // transpose into rows
  let newBoard = board.clone();

  for (let col = 0; col < 4; col++) {
    // read column
    let colVals = [
      newBoard.getCell(0, col),
      newBoard.getCell(1, col),
      newBoard.getCell(2, col),
      newBoard.getCell(3, col),
    ];
    // merge left
    let merged = mergeRowLeft(colVals);

    // write back
    for (let row = 0; row < 4; row++) {
      newBoard.setCell(row, col, merged[row]);
    }
  }

  return newBoard;
}

/**
 * applyMoveDown:
 * Similar logic: reverse each column, merge left, reverse back.
 */
function applyMoveDown(board: GameBoard): GameBoard {
  let newBoard = board.clone();

  for (let col = 0; col < 4; col++) {
    let colVals = [
      newBoard.getCell(3, col),
      newBoard.getCell(2, col),
      newBoard.getCell(1, col),
      newBoard.getCell(0, col),
    ];
    let merged = mergeRowLeft(colVals);

    // reverse back
    newBoard.setCell(3, col, merged[0]);
    newBoard.setCell(2, col, merged[1]);
    newBoard.setCell(1, col, merged[2]);
    newBoard.setCell(0, col, merged[3]);
  }

  return newBoard;
}

/**
 * applyMoveUpDown:
 * Apply move up or down to all columns.
 */
function applyMoveUpDown(board: GameBoard, direction: Field): GameBoard {
  let newBoard = board.clone();
  const isDown = direction.equals(Field(MoveDirection.Down));

  for (let col = 0; col < 4; col++) {
    let colVals = [
      newBoard.getCell(0, col),
      newBoard.getCell(1, col),
      newBoard.getCell(2, col),
      newBoard.getCell(3, col),
    ];

    let toMerge = reverseIf(isDown, colVals);

    // mergeRowLeft can still accept a normal Field[]
    let merged = mergeRowLeft(toMerge);

    let finalVals = reverseIf(isDown, merged);

    // set final
    for (let row = 0; row < 4; row++) {
      newBoard.setCell(row, col, finalVals[row]);
    }
  }

  return newBoard;
}

/**
 * applyMoveLeftRight:
 * Apply move left or right to all rows.
 */
function applyMoveLeftRight(board: GameBoard, direction: Field): GameBoard {
  let newBoard = board.clone();
  const isRight = direction.equals(Field(MoveDirection.Right));

  for (let row = 0; row < 4; row++) {
    let rowVals = [
      newBoard.getCell(row, 0),
      newBoard.getCell(row, 1),
      newBoard.getCell(row, 2),
      newBoard.getCell(row, 3),
    ];

    let toMerge = reverseIf(isRight, rowVals);

    let merged = mergeRowLeft(toMerge);

    let finalVals = reverseIf(isRight, merged);

    for (let col = 0; col < 4; col++) {
      newBoard.setCell(row, col, finalVals[col]);
    }
  }

  return newBoard;
}

/**
 * reverseIf:
 * Helper to reverse an array conditionally.
 */
function reverseIf(condition: Bool, arr: Field[]): Field[] {
  return [
    Provable.if(condition, arr[3], arr[0]),
    Provable.if(condition, arr[2], arr[1]),
    Provable.if(condition, arr[1], arr[2]),
    Provable.if(condition, arr[0], arr[3]),
  ];
}

/**
 * applyOneMoveCircuit:
 * Use Provable.switch over the 'direction' Field
 * to pick which move function is used.
 */
export function applyOneMoveCircuit(
  board: GameBoard,
  direction: Field,
): GameBoard {
  let noChangeBoard = board.clone();
  const upDownBoard = applyMoveUpDown(board, direction);
  const leftRightBoard = applyMoveLeftRight(board, direction);

  // Check which direction we're moving
  const isNone = direction.equals(Field(MoveDirection.None));
  const isUpDown = direction
    .equals(Field(MoveDirection.Up))
    .or(direction.equals(Field(MoveDirection.Down)));
  const isLeftRight = direction
    .equals(Field(MoveDirection.Left))
    .or(direction.equals(Field(MoveDirection.Right)));

  return Provable.switch([isNone, isUpDown, isLeftRight], GameBoard, [
    noChangeBoard,
    upDownBoard,
    leftRightBoard,
  ]);
}

/**
 * applyMovesCircuit:
 * Apply a list of direction Fields in sequence.
 */
export function applyMovesCircuit(
  board: GameBoard,
  directions: Field[],
): GameBoard {
  let current = board;

  for (let i = 0; i < directions.length; i++) {
    current = applyOneMoveCircuit(current, directions[i]);
  }

  return current;
}

/**
 * Example function that demonstrates how you'd verify the transition:
 * oldBoard --(directions)--> newBoard
 */
export function verifyTransition(
  oldStateBoard: GameBoard,
  directionBits: Field,
  maxMoves: number,
  claimedNewStateBoard: GameBoard,
) {
  // 1) parse directions from the single field
  let dirs = parseDirections(directionBits, maxMoves);
  // 2) apply them
  let resultingBoard = applyMovesCircuit(oldStateBoard, dirs);

  // 3) assert equality
  for (let i = 0; i < 16; i++) {
    resultingBoard.cells[i].assertEquals(claimedNewStateBoard.cells[i]);
  }
  // If we pass all asserts, the circuit is satisfied.
}

/**
 * Utility function to log a 4x4 board in console for debugging.
 */
export function printBoard(board: GameBoard) {
  for (let row = 0; row < 4; row++) {
    const rowVals = [];

    for (let col = 0; col < 4; col++) {
      rowVals.push(board.getCell(row, col).toString());
    }
    console.log(rowVals.join("\t"));
  }
  console.log("--------------");
}
