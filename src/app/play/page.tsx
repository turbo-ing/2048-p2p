"use client";

import { Card } from "@nextui-org/react";
import cx from "classnames";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import Image from "next/image";
import { createChannel, createClient } from "nice-grpc-web";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { Color } from "../../pb/game";
import { Navbar } from "../components/Navbar";
import { ResultModal } from "../components/ResultModal";
import { onCellClick, sendSequencerFee } from "../core/play";
import useIsMobile from "../hooks/useIsMobile";

import { NodeDefinition, Position } from "@/pb/query";
import { getPossibleMoves, useChess } from "@/reducer/chess";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";
import { useRouter } from "next/navigation";
import { ConnectingModal } from "../components/ConnectingModal";

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
  const [gameState, dispatch, connected, room, setRoom] = useChess();
  const turboEdge = useTurboEdgeV0();
  const peerId = turboEdge?.node.peerId.toString();
  const publicKey = peerId || "";

  const whitePlayer = gameState.whitePlayer;
  const blackPlayer = gameState.blackPlayer;

  // const isBlackPlayer = publicKey === blackPlayer;
  const isWhitePlayer = publicKey === whitePlayer;

  console.log(gameState);

  // const [gameState, setGameState] = useState<GameState>({} as GameState);
  const [selectedCell, _setSelectedCell] = useState<Position | null>(null);
  const [nextMoves, setNextMoves] = useState<{ [pos: string]: Boolean }>({});
  const [isBoardReversed, setIsBoardReversed] = useState<Boolean>(false);
  const [localPrivateKey, setLocalPrivateKey] = useState<string>("");
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [resultModal, setResultModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState("0");
  const [txSent, setTxSent] = useState<string | null>(null);
  const router = useRouter();

  const fetchBalance = async () => {
    if (provider && wallet) {
      const localPublicKey = await wallet?.getAddress();

      if (!localPublicKey) return;
      const walletBalance = await provider.getBalance(localPublicKey!);
      const walletBalanceInEth = ethers.utils.formatEther(walletBalance);

      setWalletBalance(walletBalanceInEth);
    }
  };
  const channel = createChannel(
    (process.env.NEXT_PUBLIC_CHANNEL as string) || "http://127.0.0.1:50050",
  );
  const client = createClient(NodeDefinition, channel);
  const isMobile = useIsMobile();
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const numbers = [8, 7, 6, 5, 4, 3, 2, 1];

  function shortenAddress(address: string): string {
    return address;
    // // Ensure that the address is long enough to be shortened
    // if (address.length <= 4 + 3) {
    //   return address;
    // }

    // // Slice the start and end part of the string
    // const start = address.slice(0, 4);
    // const end = address.slice(-3);

    // // Return the shortened version with "..."
    // return `${start}...${end}`;
  }

  // usePeersFetcher(setPublicKey, setProvider);
  // useGameStateFetcher({
  //   setGameState,
  //   setResultModal,
  //   setIsWinner,
  //   client,
  //   publicKey,
  //   whitePlayer,
  //   blackPlayer,
  // });

  // useEffect(() => {
  //   setLocalPrivateKey(sessionStorage.getItem("localPrivateKey")!);
  //   setWhitePlayer(sessionStorage.getItem("whitePlayer")!);
  //   setBlackPlayer(sessionStorage.getItem("blackPlayer")!);
  // }, []);

  useEffect(() => {
    if (!room) {
      router.push("/");
    }
  }, [room]);

  useEffect(() => {
    fetchBalance();
  }, [wallet]);

  useEffect(() => {
    setIsBoardReversed(publicKey === blackPlayer);
  }, [blackPlayer, publicKey]);

  useEffect(() => {
    if (provider) {
      if (localPrivateKey) {
        setWallet(new ethers.Wallet(localPrivateKey).connect(provider!));
      }
    }
  }, [provider, localPrivateKey]);

  const setSelectedCell: Dispatch<SetStateAction<Position | null>> = (
    position: SetStateAction<Position | null>,
  ) => {
    if (typeof position !== "function" && position && gameState.board) {
      const actualRow = isBoardReversed ? 7 - position.x : position.x;
      const actualCol = isBoardReversed ? position.y : position.y;
      const piece = gameState.board.rows[actualRow].cells[actualCol].piece;

      if (piece?.color !== (isWhitePlayer ? Color.WHITE : Color.BLACK)) {
        return;
      }

      const nextMoves = getPossibleMoves(
        piece,
        { row: actualRow, col: actualCol },
        gameState.board,
      );

      const moveMap: { [pos: string]: boolean } = {};

      for (const move of nextMoves) {
        moveMap[`${isBoardReversed ? 7 - move.row : move.row},${move.col}`] =
          true;
      }

      setNextMoves(moveMap);
    }

    if (!position) {
      setNextMoves({});
    }

    _setSelectedCell(position);
  };

  const makeMove = async (from: Position, to: Position) => {
    const newBoard = JSON.parse(JSON.stringify(gameState.board));
    const piece = newBoard.rows[from.x].cells[from.y].piece;

    if (piece) {
      newBoard.rows[to.x].cells[to.y].piece = piece;
      newBoard.rows[from.x].cells[from.y].piece = null;

      dispatch({
        type: "MOVE",
        payload: {
          from: {
            row: from.x,
            col: from.y,
          },
          to: {
            row: to.x,
            col: to.y,
          },
        },
      });

      // setGameState({ ...gameState, board: newBoard });
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
    dispatch({
      type: "LEAVE",
    });
  };

  const [isTurn, setIsTurn] = useState(true);

  useEffect(() => {
    setIsTurn(
      (gameState.turn === Color.WHITE && whitePlayer === publicKey) ||
        (blackPlayer === publicKey && gameState.turn === Color.BLACK),
    );

    const executeSendSequencerFee = async () => {
      if (txSent) {
        return;
      }
      const txHash = await sendSequencerFee({ wallet });
      setTxSent(txHash);
      console.log(txHash);
    };

    executeSendSequencerFee();
  }, [gameState]);

  return (
    <div className="bg-black">
      <Navbar
        isDark
        isShowButton
        walletBalance={walletBalance}
        address={shortenAddress(publicKey)}
        wallet={wallet}
        onClick={() => window.location.reload()}
      />
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
          isWinner={
            gameState.winner === (isWhitePlayer ? Color.WHITE : Color.BLACK)
          }
          isDraw={gameState.winner === null}
          open={gameState.winner !== undefined}
          onClose={() => setResultModal(false)}
        />
        <ConnectingModal open={!connected}></ConnectingModal>
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
                          "w-full h-full flex items-center justify-center transition",
                          selectedCell?.x === rowIndex &&
                            selectedCell?.y === colIndex
                            ? "border-2 border-blue-500"
                            : "",
                          (rowIndex + colIndex) % 2 === 0
                            ? nextMoves[`${rowIndex},${colIndex}`]
                              ? "bg-[#e91010]"
                              : "bg-[#F24545]"
                            : nextMoves[`${rowIndex},${colIndex}`]
                            ? "bg-[#7c7c7c]"
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
                            isTurn: isTurn,
                            txSent,
                            setTxSent,
                            board: gameState.board!,
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
      </main>
    </div>
  );
}
