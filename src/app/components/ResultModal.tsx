"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Modal from "./Modal";

export interface Player {
  name: string;
  score: number;
}

interface ResultModalProps {
  player: String
  isWinner: boolean;
  open: boolean;
  rankingData: Player[];
  onClose?: () => void;
}

export const ResultModal = ({
  player,
  open,
  onClose,
  isWinner,
  rankingData,
}: ResultModalProps) => {
  const router = useRouter();
  const [ranking, _setRanking] = useState<Player[]>(rankingData);
  const playerCount = ranking.length;

  return (
    <Modal show={open}>
      <div>
        <div className="relative flex justify-center items-center">
          <img
            alt=""
            src={isWinner ? "/svg/2048-winner.svg" : "/svg/2048-loser.svg"}
          />
        </div>
        <div className="py-6 text-center">
          <div className="text-[#F5F5F6] font-semibold text-3xl">
            {playerCount > 1 && ((player == ranking[0].name) ? "You've won the match!" : "You've been beaten!")}
            {playerCount < 2 && (isWinner ? "You win!" : "Game over!")}
          </div>
          <div className="text-xl my-4">
            <p className="text-center text-2xl mb-2 font-bold">{playerCount > 1 && "Ranking"}</p>
            <ul className="counter-list">
              {playerCount > 1 && (ranking.map((player) => (
                <li
                  key={player.name}
                  className="flex justify-between relative px-5 mb-2 last:mb-0"
                >
                  <p>{player.name}</p>
                  <p>{player.score}</p>
                </li>
              )))}
              {playerCount < 2 && "Score: "+ranking[0].score}
            </ul>
          </div>
          <div className="mt-3 text-[#94969C] font-medium text-base">
          {playerCount > 1 && ((player == ranking[0].name) ? 
                "Congratulations! Your strategy and skill have prevailed. Well played!"
              : "Good effort! Learn from this match and come back stronger. Better luck next time!")}
            {playerCount < 2 && (isWinner ? "You're officially a 2048 master!" : "Better luck next time!")}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center justify-center w-1/3"
            onClick={() => window.location.reload()}
          >
            <img alt="" src="/svg/home.svg" />
            <div>Home</div>
          </button>
          <button
            className="rounded-full py-2.5 px-4 bg-[#F23939] text-white text-base font-semibold gap-1.5 flex items-center justify-center w-full"
            onClick={() => {
              router.push("/");
            }}
          >
            <img alt="" src="/svg/repeat.svg" />
            <div>Rematch</div>
          </button>
        </div>
      </div>
    </Modal>
  );
};
