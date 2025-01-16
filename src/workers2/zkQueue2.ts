"use client";

import { GameBoardWithSeed } from "../lib2/game2048ZKLogic2";
import ZkClient2 from "./zkClient2";

// Global Singleton
export const zkClient2: ZkClient2 = new ZkClient2();

if (typeof window !== "undefined") {
  zkClient2.compileZKProgram().then((result) => {
    console.log("Verification Key:", result);
  });
}

let myPeerId: string = "";

export function assignMyPeerId(peerId: string) {
  myPeerId = peerId;
}

export async function queueMove(
  peerId: string,
  zkBoard: GameBoardWithSeed,
  move: string,
) {
  if (peerId != myPeerId) return;
  if (move == "init") {
    return zkClient2.initZKProof(zkBoard);
  } else {
    return zkClient2.addMove(zkBoard, move);
  }
}
