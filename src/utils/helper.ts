import { Grid, GRID_SIZE } from "@/reducer/2048";

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
