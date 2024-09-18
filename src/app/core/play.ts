import { ethers } from "ethers";
import { Dispatch } from "react";

import { sequencerWallet } from "./link";

import { Position } from "@/pb/query";

interface onCellClickParams {
  pos: Position;
  selectedCell: Position | null;
  setSelectedCell: Dispatch<React.SetStateAction<Position | null>>;
  isBoardReversed: Boolean;
  makeMove: (from: Position, to: Position) => Promise<void>;
  whitePlayer: string;
  blackPlayer: string;
  player: string;
  client: any;
  wallet: ethers.Wallet | null;
  isTurn: boolean;
  txSent: string | null;
  setTxSent: Dispatch<React.SetStateAction<string | null>>;
}

const sendSequencerFee = async ({
  wallet
}: { wallet: ethers.Wallet | null }): Promise<string | null> => {
   const sentTx = await wallet?.sendTransaction({
     to: sequencerWallet,
     value: ethers.utils.parseEther("0.00001"),
     type: 2,
   });

   await sentTx?.wait();

  return sentTx?.hash || null;
};

const onCellClick = async ({
  selectedCell,
  isBoardReversed,
  setSelectedCell,
  makeMove,
  whitePlayer,
  blackPlayer,
  client,
  wallet,
  player,
  pos,
  isTurn,
  txSent,
  setTxSent,
}: onCellClickParams) => {
  if (selectedCell && isTurn) {
    const actualFromPos = isBoardReversed
      ? { x: 7 - selectedCell.x, y: selectedCell.y }
      : selectedCell;
    const actualToPos = isBoardReversed ? { x: 7 - pos.x, y: pos.y } : pos;

    await makeMove(actualFromPos, actualToPos);
    setSelectedCell(null);

    const message = {
      whitePlayer,
      blackPlayer,
      player,
      action: [actualFromPos, actualToPos],
      sequencerFeeHash: txSent,
    };
    
    const signature = await wallet?.signMessage(JSON.stringify(message))!;
    const publicKey = await wallet?.getAddress()!;

    try {
      const response = await client.transact({
        ...message,
        signature,
        publicKey,
      });

      setTxSent(null);
    } catch (e) {
      console.error("Error making move:", e);
    }
  } else {
    setSelectedCell(pos);
  }
};

export { onCellClick, sendSequencerFee };
