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
  downloadProof: () => void;
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
  const [state, dispatch, _, room, setRoom, zkClient] = use2048();
  const [ranking, setRanking] = useState<Player[]>(rankingData);
  const [isZKModalOpen, setIsZKModalOpen] = useState<boolean>(true);
  const [isRematchRequested, setIsRematchRequested] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const { address, connect, connected } = useAuroWallet();
  const { leaderboard } = useLeaderboard();

  const highScore = leaderboard?.myself?.maxScore || 0;

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
    setRoom("");
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

  const renderZKModalContent = () => (
    <div>
      {lenQueue === 0 && !remProcessing ? (
        <>
          <h2 className="font-semibold text-2xl md:text-4xl text-center">
            Submit your score
          </h2>
          <p className="mt-2 text-lg">Score: {ranking[0].score}</p>
          <p className="mt-3 text-center text-base">
            {submitted
              ? "Wait 3 minutes for your score to show in the leaderboard."
              : "Click the button below to submit your score."}
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
