import { ethers } from 'ethers';
import { Dispatch } from 'react';

import { sequencerWallet } from './link';

import { Position } from '@/pb/query';

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
}

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
}: onCellClickParams) => {
  if (selectedCell) {
    const actualFromPos = isBoardReversed
      ? { x: 7 - selectedCell.x, y: selectedCell.y }
      : selectedCell;
    const actualToPos = isBoardReversed ? { x: 7 - pos.x, y: pos.y } : pos;

    await makeMove(actualFromPos, actualToPos);
    setSelectedCell(null);

    const sentTx = await wallet?.sendTransaction({
      to: sequencerWallet,
      value: ethers.utils.parseEther('0.00001'),
      type: 2,
      // gasLimit: ethers.BigNumber.from(21000),
    });

    const sequencerFeeHash = sentTx!.hash;

    console.log(sequencerFeeHash);

    console.log('Sent transaction:', sentTx);

    const message = {
      whitePlayer,
      blackPlayer,
      player,
      action: [actualFromPos, actualToPos],
      sequencerFeeHash,
    };

    const signature = await wallet?.signMessage(JSON.stringify(message))!;
    const publicKey = await wallet?.getAddress()!;

    try {
      const response = await client.transact({
        ...message,
        signature,
        publicKey,
      });

      console.log('Transaction response:', response);
    } catch (e) {
      console.error('Error making move:', e);
    }
  } else {
    setSelectedCell(pos);
  }
};

export { onCellClick };
