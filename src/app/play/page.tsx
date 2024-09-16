"use client";

import { Card } from "@nextui-org/react";
import cx from "classnames";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import Image from "next/image";
import { createChannel, createClient } from "nice-grpc-web";
import { useEffect, useState } from "react";

import { Color, GameState } from "../../pb/game";
import { Navbar } from "../components/Navbar";
import { PlayerCard, PlayerMobileCard } from "../components/playerCard";
import { ResultModal } from "../components/ResultModal";
import { onCellClick } from "../core/play";
import { useGameStateFetcher, usePeersFetcher } from "../hooks/gameHooks";
import useIsMobile from "../hooks/useIsMobile";

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

export default function Play() {
  const [gameState, setGameState] = useState<GameState>({} as GameState);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [isBoardReversed, setIsBoardReversed] = useState<Boolean>(false);
  const [whitePlayer, setWhitePlayer] = useState<string>("");
  const [blackPlayer, setBlackPlayer] = useState<string>("");
  const [publicKey, setPublicKey] = useState<string>("");
  const [localPrivateKey, setLocalPrivateKey] = useState<string>("");
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [resultModal, setResultModal] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  const channel = createChannel(
    (process.env.NEXT_PUBLIC_CHANNEL as string) || "http://127.0.0.1:50050",
  );
  const client = createClient(NodeDefinition, channel);
  const isMobile = useIsMobile();
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const numbers = [8, 7, 6, 5, 4, 3, 2, 1];

  function shortenAddress(address: string): string {
    // Ensure that the address is long enough to be shortened
    if (address.length <= 4 + 3) {
      return address;
    }

    // Slice the start and end part of the string
    const start = address.slice(0, 4);
    const end = address.slice(-3);

    // Return the shortened version with "..."
    return `${start}...${end}`;
  }

  usePeersFetcher(setPublicKey, setProvider);
  useGameStateFetcher({
    setGameState,
    setResultModal,
    setIsWinner,
    client,
    publicKey,
    whitePlayer,
    blackPlayer,
  });

  useEffect(() => {
    setLocalPrivateKey(sessionStorage.getItem("localPrivateKey")!);
    setWhitePlayer(sessionStorage.getItem("whitePlayer")!);
    setBlackPlayer(sessionStorage.getItem("blackPlayer")!);
  }, []);

  useEffect(() => {
    setIsBoardReversed(publicKey === whitePlayer);
  }, [whitePlayer, publicKey]);

  useEffect(() => {
    if (provider) {
      if (localPrivateKey) {
        setWallet(new ethers.Wallet(localPrivateKey).connect(provider!));
      }
    }
  }, [provider, localPrivateKey]);

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

  const onEndGameClick = async () => {
    try {
      const signer = provider?.getSigner();

      const message = JSON.stringify({
        whitePlayer,
        blackPlayer,
        action: "endGame",
      });

      const signature = await signer?.signMessage(message);

      setIsWinner(false);

      const _response = await client.endGame({
        whitePlayer,
        blackPlayer,
        signature,
      });
    } catch (err) {
      console.log(err);
    }

    setResultModal(true);
  };

  const isBlackPlayer = publicKey === blackPlayer;
  const isWhitePlayer = publicKey === whitePlayer;

  return (
    <div className="bg-black">
      <Navbar isDark />
      <main className="flex items-center justify-between min-h-screen gap-6 max-w-7xl mx-auto lg:flex-nowrap flex-wrap pt-20">
        {isMobile ? (
          <div className="py-5 text-center w-full">
            {(gameState.turn === Color.WHITE && whitePlayer == publicKey) ||
            (blackPlayer == publicKey && gameState.turn === Color.BLACK) ? (
              <div className="text-[#FCFCFD] text-lg font-semibold">
                Your Turn
              </div>
            ) : (
              <div className="text-[#FCFCFD] text-lg font-semibold">
                Opponent&apos;s Turn
              </div>
            )}
            {/* <div className="text-[#FCFCFD] mt-2 text-6xl font-semibold">
              0:12
            </div> */}
          </div>
        ) : (
          <div className="lg:block hidden w-96">
            <PlayerCard
              address={whitePlayer}
              amount="42.069 ETH"
              image="/img/avatar.png"
            />
            <div className="py-5 text-center">
              {(gameState.turn === Color.WHITE && whitePlayer == publicKey) ||
              (blackPlayer == publicKey && gameState.turn === Color.BLACK) ? (
                <div className="text-[#FCFCFD] text-4xl font-semibold">
                  Your Turn
                </div>
              ) : (
                <div className="text-[#FCFCFD] text-4xl font-semibold">
                  Opponent&apos;s Turn
                </div>
              )}
              {/* <div className="text-[#FCFCFD] mt-2 text-6xl font-semibold">
                0:12
              </div> */}
            </div>
            <PlayerCard
              opponent
              address={blackPlayer}
              amount="42.069 ETH"
              image="/img/avatar2.png"
            />
            <div className="mt-8 px-6 flex justify-between">
              <button
                className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center justify-center w-full"
                onClick={onEndGameClick}
              >
                <div className="flex items-center justify-center">
                  <img alt="" src="/svg/close.svg" />
                  <div className="ml-2">End Game</div>
                </div>
              </button>
              {/* <button className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center">
                <img alt="" src="/svg/rematch.svg" />
                <div>Rematch</div>
              </button> */}
            </div>
          </div>
        )}
        <ResultModal
          isWinner={isWinner}
          open={resultModal}
          onClose={() => setResultModal(false)}
        />
        <div className="flex justify-center w-full">
          <Card className="pr-2 md:pl-2.5 md:pb-2.5 md:pt-10 md:pr-10 pt-4 bg-[#CFD1D21A] shadow-lg rounded-lg w-screen lg:w-[700px] lg:h-[700px] md:max-w-[700px] lg:max-w-[680px] max-h-screen">
            <div className="grid-container gap-0 relative w-full aspect-square">
              {/* Main Chessboard */}
              {gameState.board?.rows.map((row, rowIndex) => (
                <>
                  <div
                    key={`number-${rowIndex}`}
                    className="flex justify-center items-center text-sm md:text-xl font-bold text-[#D8E3DA]"
                  >
                    {numbers[rowIndex]}
                  </div>
                  {row.cells.map((_, colIndex) => {
                    const pieceSrc = getFigSrc(rowIndex, colIndex);
                    const pieceKey = `${gameState.board?.rows[rowIndex].cells[colIndex].piece?.color}${gameState.board?.rows[rowIndex].cells[colIndex].piece?.kind}${rowIndex}${colIndex}`;

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={cx(
                          "w-full h-full flex items-center justify-center",
                          selectedCell?.x === rowIndex &&
                            selectedCell?.y === colIndex
                            ? "border-2 border-blue-500"
                            : "",
                          (rowIndex + colIndex) % 2 === 0
                            ? "bg-[#F24545]"
                            : "bg-[#9B9B9B]",
                        )}
                        role="button"
                        tabIndex={0}
                        onClick={async () =>
                          await onCellClick({
                            selectedCell,
                            setSelectedCell,
                            makeMove,
                            whitePlayer,
                            blackPlayer,
                            client,
                            wallet,
                            player: publicKey,
                            isBoardReversed,
                            pos: { x: rowIndex, y: colIndex },
                          })
                        }
                        onKeyDown={() => null}
                      >
                        {pieceSrc && (
                          <motion.div
                            animate={{ opacity: 1 }}
                            initial={{ opacity: 0 }}
                            layoutId={pieceKey}
                            style={{ position: "absolute" }}
                            transition={{ duration: 0.3 }}
                          >
                            {isMobile ? (
                              <Image
                                alt=""
                                height={30}
                                src={pieceSrc}
                                width={30}
                              />
                            ) : (
                              <Image
                                alt=""
                                height={50}
                                src={pieceSrc}
                                width={50}
                              />
                            )}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
              <div />
              {letters.map((letter, index) => (
                <div
                  key={index}
                  className="flex justify-center items-center text-sm md:text-xl font-bold text-[#D8E3DA]"
                >
                  {letter}
                </div>
              ))}
            </div>
          </Card>
        </div>
        {isMobile && (
          <div className="flex w-full flex-col px-4">
            <div className="flex justify-between items-center font-semibold w-full">
              <PlayerMobileCard address={whitePlayer} image="/img/avatar.png" />
              <div className="text-[#FCFCFD] text-5xl">Vs</div>
              <PlayerMobileCard
                opponent
                address={blackPlayer}
                image="/img/avatar2.png"
              />
            </div>
            <hr className="border-[#D8E3DA] my-5" />
            <button
              className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center justify-center"
              onClick={onEndGameClick}
            >
              <img alt="" src="/svg/close.svg" />
              <div>End Game</div>
            </button>
            {/* <button className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center justify-center mt-4">
              <img alt="" src="/svg/rematch.svg" />
              <div>Rematch</div>
            </button> */}
          </div>
        )}
      </main>
    </div>
  );
}
