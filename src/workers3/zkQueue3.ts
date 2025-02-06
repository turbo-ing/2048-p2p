"use client";

import { GameBoardWithSeed } from "../lib2/game2048ZKLogic2";
import ZkClient4 from "./zkClient4";

// Global Singleton
export const zkClient4: ZkClient4 = new ZkClient4();

//Start compiling the ZK program if we have a window.
if (typeof window !== "undefined") {
  zkClient4.compileZKProgram().then((result) => {
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
    //console.log("init detected");
    return zkClient4.addBoard(zkBoard);
  } else {
    return zkClient4.addMove(zkBoard, move);
  }
}
