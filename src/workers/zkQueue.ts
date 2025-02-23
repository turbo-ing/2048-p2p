"use client";

import { GameBoardWithSeed } from "../lib/game2048ZKLogic";
import ZkClient from "./zkClient";

// Global Singleton
export const zkClient: ZkClient = new ZkClient();

//Start compiling the ZK program if we have a window.
if (typeof window !== "undefined") {
  zkClient.compileZKProgram().then((result) => {
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
    return zkClient.addBoard(zkBoard);
  } else {
    return zkClient.addMove(zkBoard, move);
  }
}
