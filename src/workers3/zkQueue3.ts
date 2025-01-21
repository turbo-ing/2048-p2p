"use client";

import { GameBoardWithSeed } from "../lib2/game2048ZKLogic2";
import ZkClient3 from "./zkClient3";

// Global Singleton
export const zkClient3: ZkClient3 = new ZkClient3();

//Start compiling the ZK program if we have a window.
if (typeof window !== "undefined") {
  zkClient3.compileZKProgram().then((result) => {
    console.log("Verification Key:", result);
  });
}

//initialise peer ID
let myPeerId: string = "";

//used in playNow, using a provided peer ID
export function assignMyPeerId(peerId: string) {
  myPeerId = peerId;
}

//used in 2048 reducer, when a MOVE operation is received for a given peer's board.
export async function queueMove(
  peerId: string,
  zkBoard: GameBoardWithSeed,
  move: string,
) {
  if (peerId != myPeerId) return;
  if (move === "init") {
    return zkClient3.addBoard(zkBoard);
  } else {
    return zkClient3.addMove(zkBoard, move);
  }
}
