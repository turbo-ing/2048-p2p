"use client";

import { useState, useEffect } from "react";

import Modal from "./Modal";
import Button from "./Button";
import Link from "next/link";
import { use2048 } from "@/reducer/2048";
import { useAuroWallet } from "../mina/useAuroWallet";
import { useLeaderboard } from "../hooks/useLeaderboard";

export interface Player {
  name: string;
  score: number;
}

interface ResultModalProps {
  rematch: () => void;
  rem: number;
  remProcessing: boolean;
  surrendered: { [playerId: string]: boolean };
  frontSurrendered: { [name: string]: boolean };
  allSurrendered: boolean;
  downloadProof: (playerId?: string) => void;
  lenQueue: number;
  // leave: () => void;
  player: string;
  isWinner: boolean;
  open: boolean;
  totalPlayers: number;
  rankingData: Player[];
  onClose?: () => void;
  isForceSubmit: boolean;
  setIsForceSubmit: (isForceSubmit: boolean) => void;
}

export const ResultModal = ({
  rematch,
  rem,
  remProcessing,
  surrendered,
  allSurrendered,
  frontSurrendered,
  downloadProof,
  lenQueue,
  player,
  open,
  isWinner,
  rankingData,
  totalPlayers,
  isForceSubmit,
  setIsForceSubmit,
}: ResultModalProps) => {
  const [
    state,
    dispatch,
    rtc,
    createRoom,
    joinRoom,
    leaveRoom,
    getRooms,
    rtcConfig,
    rtcPeers,
    zkClient,
  ] = use2048();
  const [ranking, setRanking] = useState<Player[]>(rankingData);
  const [isZKModalOpen, setIsZKModalOpen] = useState<boolean>(true);
  const [isRematchRequested, setIsRematchRequested] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const { address, connect, connected } = useAuroWallet();
  const { leaderboard } = useLeaderboard();

  const highScore = leaderboard?.myself?.maxScore || 0;

  // Helper function to get playerId from player name
  const getPlayerIdFromName = (playerName: string): string | undefined => {
    return Object.keys(state.players).find(
      (playerId) => state.players[playerId] === playerName,
    );
  };

  // Helper function to download all player proofs
  const downloadAllProofs = () => {
    state.playerId.forEach((playerId) => {
      if (state.compiledProof[playerId]) {
        downloadProof(playerId);
      }
    });
  };

  // Helper function to check if proofs are available for all players
  const areAllProofsAvailable = () => {
    return state.playerId.every((playerId) => state.compiledProof[playerId]);
  };

  useEffect(() => {
    if (isRematchRequested && lenQueue === 0 && !remProcessing) {
      setIsRematchRequested(false);
      rematch();
    }
  }, [isRematchRequested, lenQueue, remProcessing, rematch]);

  const getHeadingText = () => {
    if (totalPlayers > 1) {
      return allSurrendered
        ? "All opponents surrendered!"
        : player === ranking[0].name
          ? "You've won the match!"
          : "You've been beaten!";
    }

    if (rankingData[0].score > highScore) {
      return "Congratulations!";
    } else {
      return "Game over!";
    }

    return isWinner ? "You win!" : "Game over!";
  };

  const getSubText = () => {
    if (totalPlayers > 1) {
      return player === ranking[0].name
        ? "Congratulations! Your strategy and skill have prevailed. Well played!"
        : "Good effort! Learn from this match and come back stronger. Better luck next time!";
    }

    if (rankingData[0].score > highScore) {
      return "You've set a new high score!";
    } else {
      return "Better luck next time!";
    }

    return isWinner
      ? "You're officially a 2048 master!"
      : "Better luck next time!";
  };

  const renderRanking = () => (
    <div className="text-center mt-3">
      {totalPlayers > 1 ? (
        <>
          <p className="text-2xl font-bold mb-2">Ranking</p>
          <ul className="counter-list">
            {ranking.map(({ name, score }) => (
              <li
                key={name}
                className="flex justify-between px-5 mb-2 last:mb-0"
              >
                <p>{name}</p>
                <p>{frontSurrendered[name] ? "Surrendered!" : score}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-lg">Score: {ranking[0].score}</p>
      )}
    </div>
  );

  const handleLeave = () => {
    if (isForceSubmit) {
      dispatch({
        type: "LEAVE",
      });
    }
  };

  const renderButtons = () => (
    <div className="mt-8 space-y-2 text-white transition-all sm:space-y-0 sm:flex sm:justify-center sm:gap-4 text-base">
      <Link href={""} passHref>
        <Button className="w-full sm:w-auto" onClick={handleLeave}>
          Home
        </Button>
      </Link>
      {
        <Button
          onClick={() => setIsZKModalOpen(true)}
          className="w-full sm:w-auto"
          disabled={submitted || submitting}
        >
          Submit Score
        </Button>
      }
      {/* {isForceSubmit && rankingData[0].score <= highScore && (
        <Button
          onClick={() => setIsForceSubmit(false)}
          className="w-full sm:w-auto"
        >
          Continue
        </Button>
      )} */}
      {/* <Button
        onClick={() => {
          if (lenQueue !== 0) {
            setIsZKModalOpen(true);
            setIsRematchRequested(true);
          } else {
            rematch();
          }
        }}
        className="w-full sm:w-auto"
      >
        {totalPlayers < 2 ? "Play Again" : `Rematch (${rem}/${totalPlayers})`}
      </Button> */}
    </div>
  );

  const submitScore = async () => {
    if (!address) {
      connect();
    } else {
      try {
        setSubmitting(true);

        const tx = await zkClient.submitScore(address);

        const { hash } = await (window as any).mina.sendTransaction({
          transaction: tx,
          feePayer: {
            fee: 0.1,
            memo: "",
          },
        });

        console.log("Transaction submitted", tx);
        setSubmitted(true);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const renderZKModalContent = () => {
    // Find the current player's score
    const currentPlayerScore =
      ranking.find((p) => p.name === player)?.score || 0;
    const winnerScore = ranking[0].score;
    const isCurrentPlayerWinner = player === ranking[0].name;

    return (
      <div>
        {lenQueue === 0 && !remProcessing ? (
          <>
            <h2 className="font-semibold text-2xl md:text-4xl text-center">
              Submit your score
            </h2>
            {totalPlayers > 1 ? (
              <div className="mt-2 text-lg text-center">
                <p>Your Score: {currentPlayerScore}</p>
                {!isCurrentPlayerWinner && <p>Winner's Score: {winnerScore}</p>}
              </div>
            ) : (
              <p className="mt-2 text-lg">Score: {currentPlayerScore}</p>
            )}
            <p className="mt-3 text-center text-base">
              {submitted
                ? "Wait 3 minutes for your score to show in the leaderboard."
                : "Click the button below to submit your score or download your ZK proof."}
            </p>
            <div className="flex justify-center gap-4 mt-6 text-base">
              {ranking[0].score > 0 && (
                <Button
                  onClick={submitted ? handleLeave : submitScore}
                  disabled={submitting}
                >
                  {submitted
                    ? "New Game"
                    : submitting
                      ? "Submitting..."
                      : connected
                        ? "Submit Score"
                        : "Connect Auro Wallet"}
                </Button>
              )}
              {totalPlayers > 1 ? (
                <div className="flex flex-col gap-2">
                  <Button onClick={() => downloadProof()}>
                    Download My Proof
                  </Button>
                  {areAllProofsAvailable() && (
                    <Button onClick={downloadAllProofs}>
                      Download All Proofs
                    </Button>
                  )}
                  {!areAllProofsAvailable() && (
                    <div className="text-sm text-gray-500 text-center">
                      Some player proofs not yet available
                    </div>
                  )}

                  {/* Individual Player Proof Downloads */}
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-semibold mb-3 text-center">
                      Individual Player Proofs
                    </p>
                    <div className="space-y-2">
                      {state.playerId.map((playerId) => {
                        const playerName = state.players[playerId];
                        const hasProof = state.compiledProof[playerId];
                        return (
                          <div
                            key={playerId}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{playerName}</span>
                              <span className="text-xs text-gray-500">
                                {playerId.slice(0, 8)}...
                              </span>
                            </div>
                            <Button
                              onClick={() => downloadProof(playerId)}
                              disabled={!hasProof}
                              className="text-xs px-2 py-1"
                            >
                              {hasProof ? "Download" : "No Proof"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <Button onClick={() => downloadProof()}>
                  Download ZK Proof
                </Button>
              )}
              {/* <Button onClick={() => setIsZKModalOpen(false)}>
                Back to Results
              </Button> */}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-2xl md:text-4xl text-center">
              Generating ZK Proof...
            </h2>
            {/* <p className="mt-2 text-lg">Score: {ranking[0].score}</p> */}
            <p className="mt-3 text-center text-base">
              Moves left to process: {lenQueue}
            </p>
            {renderRanking()}
            {/* <div className="mt-8 flex justify-center text-base">
              <Button onClick={() => setIsZKModalOpen(false)}>
                Back to Results
              </Button>
            </div> */}

            <div className="mt-8 flex justify-center text-base">
              <Button onClick={() => {}} disabled>
                Please wait...
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Modal show={open}>
      <div className="mt-2">
        {isZKModalOpen ? (
          renderZKModalContent()
        ) : (
          <div>
            <div className="mb-6 text-center">
              <h2 className="font-semibold text-2xl md:text-4xl">
                {getHeadingText()}
              </h2>
              <p className="mt-3 text-sm">{getSubText()}</p>
            </div>
            {renderRanking()}
            {renderButtons()}
          </div>
        )}
      </div>
    </Modal>
  );
};
