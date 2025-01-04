"use client";

import { GameBoardWithSeed } from "@/lib/game2048ZKLogic";
import ZkClient from "./zkClient";

// Global Singleton
export const zkClient: ZkClient = new ZkClient();
zkClient.compileZKProgram().then((result) => {
  console.log("Verification Key:", result);
});

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
    return zkClient.initZKProof(zkBoard);
  } else {
    return zkClient.addMove(zkBoard, move);
  }
}
