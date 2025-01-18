"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import Modal from "./Modal";

export interface Player {
  name: string;
  score: number;
}

interface WaitingModalProps {
  player: string;
  isWinner: boolean;
  open: boolean;
  rankingData: Player[];
  onClose?: () => void;
}

export const WaitingModal = ({
  player,
  open,
  onClose,
  isWinner,
  rankingData,
}: WaitingModalProps) => {
  const router = useRouter();
  const [ranking, setRanking] = useState<Player[]>(rankingData);

  //Update ranking data displayed
  useEffect(() => {
    setRanking(rankingData);
  }, [rankingData]);

  return (
    <Modal show={open}>
      <div>
        <div className="relative flex justify-center items-center">
          {/* <img
            alt=""
            src={isWinner ? "/svg/2048-winner.svg" : "/svg/2048-loser.svg"}
          /> */}
        </div>
        <div className="py-6 text-center">
          <div className="mb-6">
            {/* Header */}
            <h2 className="font-semibold text-2xl md:text-4xl text-center">
              {isWinner ? "You've won 2048" : "You've lost"}
            </h2>
            {/* Optional subheading */}
            <p className="mt-3 text-center text-sm ">
              but have you beaten the others? Wait for the other players to
              finish.
            </p>
          </div>
          <div className="mt-3">
            <p className="text-center text-md mb-2 font-bold">Current scores</p>
            <ul className="counter-list">
              {ranking.map((player) => (
                <li
                  key={player.name}
                  className="flex justify-between relative px-5 mb-2 last:mb-0"
                >
                  <p>{player.name}</p>
                  <p>{player.score}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
};
