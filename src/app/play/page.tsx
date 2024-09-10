"use client";

import { Card } from "@nextui-org/react";
import * as secp256k1 from "@noble/secp256k1";
import cx from "classnames";
import { motion } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createChannel, createClient } from "nice-grpc-web";
import { hmac } from "noble-hashes/lib/hmac";
import { sha256 } from "noble-hashes/lib/sha256";
import { useEffect, useState } from "react";

import { Color, GameState } from "../../pb/game";
import { Navbar } from "../components/Navbar";

import { PlayerCard } from "./playerCard";

import { NodeDefinition, Position } from "@/pb/query";

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

secp256k1.etc.hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) => {
  const h = hmac.create(sha256, key);

  msgs.forEach((msg) => h.update(msg));

  return h.digest();
};

async function signMessage(
  privateKey: Uint8Array,
  message: any
): Promise<string> {
  const messageString = JSON.stringify(message);
  const messageHash = sha256(Buffer.from(messageString));

  console.log(Buffer.from(messageHash).toString("hex"), messageString);
  const signature = secp256k1.sign(messageHash, privateKey);

  return signature.toCompactHex();
}

export default function Play() {
  const [gameState, setGameState] = useState<GameState>({} as GameState);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [isBoardReversed, setIsBoardReversed] = useState(false);

  const publicKeyString = sessionStorage.getItem("publicKey")!;
  const privateKeyString = sessionStorage.getItem("privateKey")!;
  const privateKey = Uint8Array.from(Buffer.from(privateKeyString, "hex"));
  const addr = sessionStorage.getItem("addr") || "";
  const whitePlayer = useSearchParams().get("white_player") || "";
  const blackPlayer = useSearchParams().get("black_player") || "";

  const channel = createChannel(`http://${addr}`);
  const client = createClient(NodeDefinition, channel);

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await client.state({ whitePlayer, blackPlayer });

        if (response.state) {
          setGameState(response.state);
        }
      } catch (e) {
        console.error("Error fetching game state:", e);
      }
    };

    const intervalId = setInterval(fetchGameState, 500);

    return () => clearInterval(intervalId);
  }, [client, whitePlayer, blackPlayer]);

  useEffect(() => {
    setIsBoardReversed(publicKeyString === gameState.whitePlayer);
  }, [gameState, publicKeyString]);

  useEffect(() => {
    if (gameState.board) {
      gameState.board.rows.forEach((row, rowIndex) => {
        row.cells.forEach((cell, colIndex) => {
          if (cell.piece) {
            const pieceKey = `${cell.piece.color}${cell.piece.kind}${rowIndex}${colIndex}`;
          }
        });
      });
    }
  }, [gameState]);

  const handleCellClick = async (pos: Position) => {
    if (selectedCell) {
      const actualFromPos = isBoardReversed
        ? { x: 7 - selectedCell.x, y: selectedCell.y }
        : selectedCell;
      const actualToPos = isBoardReversed ? { x: 7 - pos.x, y: pos.y } : pos;

      await makeMove(actualFromPos, actualToPos);
      setSelectedCell(null);

      const signature = await signMessage(privateKey, {
        whitePlayer,
        blackPlayer,
        action: [actualFromPos, actualToPos],
      });

      try {
        const response = await client.transact({
          whitePlayer,
          blackPlayer,
          action: [actualFromPos, actualToPos],
          signature,
          pubKey: publicKeyString,
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

      const pieceKey = `${piece.color}${piece.kind}${from.y}${from.x}`;

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
          {/* <h1 className="text-3xl font-semibold text-center mb-6">
            Playing with
          </h1>
          <ul className="text-xs text-center indent-0 pb-5 mr-4 -mt-2 -ml-2">
            {publicKeyString === whitePlayer ? blackPlayer : whitePlayer}
          </ul> */}
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
                        : "bg-[#F0EBE3]"
                    )}
                    onClick={() =>
                      handleCellClick({ x: rowIndex, y: colIndex })
                    }
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
              })
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
