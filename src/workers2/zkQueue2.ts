"use client";

import { GameBoardWithSeed } from "../lib2/game2048ZKLogic2";
import ZkClient2 from "./zkClient2";

// Global Singleton
export const zkClient2: ZkClient2 = new ZkClient2();

//Start compiling the ZK program if we have a window.
if (typeof window !== "undefined") {
  zkClient2.compileZKProgram().then((result) => {
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

  // This doesn't apply anymore, as "init" is now our base move.
  // TODO: Construct a different action to kickstart the init.
  //       This might work as-is, but it might also be awful.
  return zkClient2.addMove(zkBoard, move);
}
