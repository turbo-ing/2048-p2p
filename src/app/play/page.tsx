"use client";

import { Card } from "@nextui-org/react";
import cx from "classnames";
import { motion } from "framer-motion";
import Image from "next/image";
import { createChannel, createClient } from "nice-grpc-web";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

import { Color, GameState } from "../../pb/game";
import { Navbar } from "../components/Navbar";
import { PlayerCard } from "../components/playerCard";
import { useGameStateFetcher, usePeersFetcher } from "../hooks/gameHooks";

import { NodeDefinition, Position } from "@/pb/query";

const SEQUENCER_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const pieceToSvg: Record<string, string> = {
  r: "/assets/rook-b.svg",
  n: "/assets/knight-b.svg",
  b: "/assets/bishop-b.svg",
  q: "/assets/queen-b.svg",
  k: "/assets/king-b.svg",
  p: "/assets/pawn-b.svg",
  R: "/assets/rook-w.svg",
  N: "/assets/knight-w.svg",
  B: "/assets/bishop-w.svg",
  Q: "/assets/queen-w.svg",
  K: "/assets/king-w.svg",
  P: "/assets/pawn-w.svg",
};

export default function Play() {
  const [gameState, setGameState] = useState<GameState>({} as GameState);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [isBoardReversed, setIsBoardReversed] = useState(false);
  const [whitePlayer, setWhitePlayer] = useState("");
  const [blackPlayer, setBlackPlayer] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);

  const channel = createChannel(`http://127.0.0.1:50050`);
  const client = createClient(NodeDefinition, channel);

  usePeersFetcher(setPublicKey, setProvider);
  useGameStateFetcher(setGameState, client, whitePlayer, blackPlayer);

  useEffect(() => {
    setIsBoardReversed(publicKey === gameState.whitePlayer);
  }, [gameState, publicKey]);

  useEffect(() => {
    setWhitePlayer(sessionStorage.getItem("whitePlayer") || "");
    setBlackPlayer(sessionStorage.getItem("blackPlayer") || "");
  }, []);

  const handleCellClick = async (pos: Position) => {
    if (selectedCell) {
      const actualFromPos = isBoardReversed
        ? { x: 7 - selectedCell.x, y: selectedCell.y }
        : selectedCell;
      const actualToPos = isBoardReversed ? { x: 7 - pos.x, y: pos.y } : pos;

      await makeMove(actualFromPos, actualToPos);
      setSelectedCell(null);

      const message = {
        whitePlayer,
        blackPlayer,
        action: [actualFromPos, actualToPos],
      };

      const signature = await provider
        ?.getSigner()
        .signMessage(JSON.stringify(message));

      try {
        const response = await client.transact({
          ...message,
          signature,
          pubKey: publicKey,
        });
      } catch (e) {
        console.error("Error making move:", e);
      }
    } else {
      setSelectedCell(pos);
    }
  };

  const makeMove = async (from: Position, to: Position) => {
    const newBoard = JSON.parse(JSON.stringify(gameState.board));
    const piece = newBoard.rows[from.x].cells[from.y].piece;

    if (piece) {
      newBoard.rows[to.x].cells[to.y].piece = piece;
      newBoard.rows[from.x].cells[from.y].piece = null;

      setGameState({ ...gameState, board: newBoard });
    }
  };

  const getFigSrc = (row: number, col: number): string => {
    const actualRow = isBoardReversed ? 7 - row : row;
    const actualCol = isBoardReversed ? col : col;
    const fig = gameState.board?.rows[actualRow].cells[actualCol].piece;

    if (!fig) return "";

    return fig.color === Color.WHITE
      ? pieceToSvg[fig.kind.toUpperCase()]
      : pieceToSvg[fig.kind.toLowerCase()];
  };

  return (
    <div className="bg-black">
      <Navbar isDark />
      <main className="flex items-center justify-between min-h-screen gap-6 max-w-7xl mx-auto">
        <div>
          <PlayerCard
            address="0x2546BcD3c84621e976D8185a91A922aE77ECEc30"
            amount="42.069 ETH"
            image="/img/avatar.png"
          />
          <div className="py-5 text-center">
            <div className="text-[#FCFCFD] text-lg font-semibold">You Turn</div>
            <div className="text-[#FCFCFD] mt-2 text-6xl font-semibold">
              0:12
            </div>
          </div>
          <PlayerCard
            opponent
            address="0x2546BcD3c84621e976D8185a91A922aE77ECEc30"
            amount="42.069 ETH"
            image="/img/avatar.png"
          />
          <div className="mt-8 px-6 flex justify-between">
            <button className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center">
              <img alt="" src="/svg/close.svg" />
              <div>End Game</div>
            </button>
            <button className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center">
              <img alt="" src="/svg/rematch.svg" />
              <div>Rematch</div>
            </button>
          </div>
        </div>
        <Card className="mx-6 p-10 bg-[#CFD1D21A] shadow-lg rounded-lg">
          <div className="grid grid-cols-8 gap-0 relative">
            {gameState.board?.rows.map((row, rowIndex) =>
              row.cells.map((_, colIndex) => {
                const pieceSrc = getFigSrc(rowIndex, colIndex);
                const pieceKey = `${gameState.board?.rows[rowIndex].cells[colIndex].piece?.color}${gameState.board?.rows[rowIndex].cells[colIndex].piece?.kind}${rowIndex}${colIndex}`;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cx(
                      "w-20 h-20 flex items-center justify-center",
                      selectedCell?.x === rowIndex &&
                        selectedCell?.y === colIndex
                        ? "border-2 border-blue-500"
                        : "",
                      (rowIndex + colIndex) % 2 === 0
                        ? "bg-[#929292]"
                        : "bg-[#F0EBE3]",
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      handleCellClick({ x: rowIndex, y: colIndex })
                    }
                    onKeyDown={() => {}}
                  >
                    {pieceSrc && (
                      <motion.div
                        animate={{ opacity: 1 }}
                        initial={{ opacity: 0 }}
                        layoutId={pieceKey}
                        style={{ position: "absolute" }}
                        transition={{ duration: 0.3 }}
                      >
                        <Image alt="" height={50} src={pieceSrc} width={50} />
                      </motion.div>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
