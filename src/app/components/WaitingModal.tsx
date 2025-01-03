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
  const [ranking, _setRanking] = useState<Player[]>(rankingData);

  //Update ranking data displayed
  useEffect(()=> {
    _setRanking(rankingData)
  })

  return (
    <div>
        <div className="relative flex justify-center items-center">
          <img
            alt=""
            src={isWinner ? "/svg/2048-winner.svg" : "/svg/2048-loser.svg"}
          />
        </div>
        <div className="py-6 text-center">
          <div className="text-[#F5F5F6] font-semibold text-3xl">
            {isWinner ? "You've won 2048" : "You've lost"}, 
            ... but have you beaten the others? Wait for the other players to finish.
          </div>
          <div className="text-xl my-4">
            <p className="text-center text-2xl mb-2 font-bold">Current scores</p>
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
  );
};
