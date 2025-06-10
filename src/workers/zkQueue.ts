"use client";

import { GameBoardWithSeed } from "@/lib/game2048ZKLogic";
import { zkClient } from "./zkClient";

if (typeof window !== "undefined") {
  // Set active instance to devnet
  zkClient.setActiveNetwork("https://api.minascan.io/node/devnet/v1/graphql");
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
    console.log("Queueing init move");
    return zkClient.initZKProof(zkBoard);
  } else {
    console.log("Queueing regular move");
    return zkClient.addMove(zkBoard, move);
  }
}
