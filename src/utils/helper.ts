import { Grid, GRID_SIZE } from "@/reducer/2048";

/**
 * Checks if two grids are equivalent.
 */
export const gridsAreEqual = (grid1: Grid, grid2: Grid): boolean => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid1[i][j]?.value !== grid2[i][j]?.value) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Checks if the grid contains a tile with value 2048.
 */
export const hasWon = (grid: Grid): boolean => {
  return grid.some((row) => row.some((tile) => tile?.value === 2048));
};

export const hasWon2 = (grid: Grid): boolean => {
  return grid.some((row) => row.some((tile) => tile?.value === 11));
};

/**
 * Checks if there are valid moves left:
 *  - If any cell is empty.
 *  - If adjacent cells (horizontal or vertical) share the same value.
 */
export const hasValidMoves = (grid: Grid): boolean => {
  // Check for empty spaces
  for (const row of grid) {
    for (const tile of row) {
      if (!tile) return true;
    }
  }

  // Check for adjacent equal tiles horizontally or vertically
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE - 1; j++) {
      const current = grid[i][j];
      const right = grid[i][j + 1];
      const down = grid[j + 1]?.[i];
      const below = grid[j]?.[i];

      if (
        (current && right && current.value === right.value) ||
        (below && down && below.value === down.value)
      ) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Quick helper to get the current state of the game:
 *  - "WON" if grid has a 2048 tile
 *  - "LOST" if no valid moves
 *  - "RUNNING" otherwise
 */
export const getGameState = (grid: Grid): "WON" | "LOST" | "RUNNING" => {
  if (hasWon2(grid)) return "WON";
  if (!hasValidMoves(grid)) return "LOST";
  return "RUNNING";
};
