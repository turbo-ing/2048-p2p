"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import Modal from "./Modal";
import Button from "./Button";

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
  downloadProof: () => void;
  lenQueue: number;
  leave: () => void;
  player: string;
  isWinner: boolean;
  open: boolean;
  totalPlayers: number;
  rankingData: Player[];
  onClose?: () => void;
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
  leave,
  player,
  open,
  onClose,
  isWinner,
  rankingData,
  totalPlayers,
}: ResultModalProps) => {
  const router = useRouter();
  const [ranking, _setRanking] = useState<Player[]>(rankingData);
  const [ZKModal, setZKModal] = useState<boolean>(false);
  const [wantsRematch, setWantsRematch] = useState<boolean>(false);

  useEffect(() => {
    if (wantsRematch && lenQueue === 0 && !remProcessing) {
      setWantsRematch(false);
      rematch();
    }
  }, [wantsRematch, lenQueue, remProcessing, rematch]);

  const headingText = () => {
    if (totalPlayers > 1 && !allSurrendered) {
      return player === ranking[0].name
        ? "You've won the match!"
        : "You've been beaten!";
    }
    if (totalPlayers > 1 && allSurrendered) {
      return "All opponents surrendered!";
    }
    return isWinner ? "You win!" : "Game over!";
  };

  const subText = () => {
    if (totalPlayers > 1) {
      return player === ranking[0].name
        ? "Congratulations! Your strategy and skill have prevailed. Well played!"
        : "Good effort! Learn from this match and come back stronger. Better luck next time!";
    }
    return isWinner
      ? "You're officially a 2048 master!"
      : "Better luck next time!";
  };

  return (
    <Modal show={open}>
      {/* Container for entire modal content */}
      <div className="p-4 sm:p-6 md:p-8 ">
        {/* If the ZK Proof modal is not shown */}
        {!ZKModal && (
          <div>
            <div className="mb-6">
              {/* Header */}
              <h2 className="font-semibold text-2xl md:text-4xl text-center">
                {headingText()}
              </h2>
              {/* Optional subheading */}
              <p className="mt-3 text-center text-sm ">{subText()}</p>
            </div>

            {/* Ranking / Scores */}
            <div className="text-center mt-3">
              {totalPlayers > 1 && (
                <>
                  <p className="text-center text-2xl mb-2 font-bold">Ranking</p>
                  <ul className="counter-list">
                    {ranking.map((p) => (
                      <li
                        key={p.name}
                        className="flex justify-between relative px-5 mb-2 last:mb-0"
                      >
                        <p>{p.name}</p>
                        {!frontSurrendered[p.name] && <p>{p.score}</p>}
                        {frontSurrendered[p.name] && <p>Surrendered!</p>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {totalPlayers < 2 && (
                <p className="mt-2 text-lg">Score: {ranking[0].score}</p>
              )}
            </div>

            {/* Buttons at the bottom */}
            <div className="mt-8 space-y-2 sm:space-y-0 sm:flex sm:justify-center sm:gap-4 text-base">
              <Button onClick={leave} className="w-full sm:w-auto">
                Home
              </Button>
              <Button
                onClick={() => setZKModal(true)}
                className="w-full sm:w-auto"
              >
                Download ZK Proof
              </Button>
              <Button
                onClick={() => {
                  if (lenQueue !== 0) {
                    setZKModal(true);
                    setWantsRematch(true);
                  } else {
                    rematch();
                  }
                }}
                className="w-full sm:w-auto"
              >
                {totalPlayers < 2 && "Play Again"}
                {totalPlayers > 1 && `Rematch (${rem}/${totalPlayers})`}
              </Button>
            </div>
          </div>
        )}

        {/* If ZK Modal is shown and queue is empty (no moves left to process) */}
        {ZKModal && lenQueue === 0 && !remProcessing && (
          <div>
            <h2 className="font-semibold text-2xl md:text-4xl text-center">
              Download ZK Proof
            </h2>
            <p className="mt-3 text-center text-sm md:text-base">
              Click the button below to download your ZK Proof.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={downloadProof}>Download Proof</Button>
              <Button onClick={() => setZKModal(false)}>Back to Results</Button>
            </div>
          </div>
        )}

        {/* If ZK Modal is shown and queue is NOT empty (still processing) or rematch is processing */}
        {ZKModal && (lenQueue !== 0 || remProcessing) && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="font-semibold text-2xl md:text-4xl">
                Generating ZK Proof...
              </h2>
              <p className="mt-3 text-sm md:text-base">
                Moves left to process: {lenQueue}
              </p>
            </div>

            {/* Ranking while ZK is processing */}
            {totalPlayers > 1 && (
              <div className="text-center mt-3">
                <p className="text-center text-2xl mb-2 font-bold">Ranking</p>
                <ul className="counter-list">
                  {ranking.map((p) => (
                    <li
                      key={p.name}
                      className="flex justify-between relative px-5 mb-2 last:mb-0"
                    >
                      <p>{p.name}</p>
                      <p>{p.score}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {totalPlayers < 2 && (
              <p className="text-center text-lg mt-2">
                Score: {ranking[0].score}
              </p>
            )}

            <div className="mt-8 flex justify-center">
              <Button
                onClick={() => {
                  if (wantsRematch) {
                    setWantsRematch(false);
                  }
                  setZKModal(false);
                }}
              >
                Back to Results
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
