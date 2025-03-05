"use client";

import { Field } from "o1js";
import { GameBoard, GameBoardWithSeed } from "../lib/game2048ZKLogic";
import ZkClient2 from "./zkClient2";

// Global Singleton
export const zkClient: ZkClient2 = new ZkClient2();

//initialise peer ID
let myPeerId: string = "";

//used in playNow, using a provided peer ID
export function assignMyPeerId(peerId: string) {
  myPeerId = peerId;
}

function safeLog2(num: number) {
  if (num === 0) {
    return 0;
  } else return Math.log2(num);
}

function logifyBoard(board: GameBoardWithSeed) {
  console.log(0);
  const boardNums = board
    .getBoard()
    .cells.map((cell) => Number(cell.toBigInt()));
  console.log(boardNums);
  console.log(1);
  const logifiedBoardNums = boardNums.map((cell) => safeLog2(cell));
  const seedNum = board.getSeed().toBigInt();
  console.log(2);
  const newBoard = new GameBoard(
    logifiedBoardNums.map((cell) => Field.from(cell.valueOf())),
  );
  console.log(3);
  return new GameBoardWithSeed({ board: newBoard, seed: Field.from(seedNum) });
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
    return zkClient.addBoard(zkBoard); //logifyBoard
  } else {
    return zkClient.addMove(zkBoard, move); //logifyBoard
  }
}
