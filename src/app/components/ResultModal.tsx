"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Modal from "./Modal";

export interface Player {
  name: string;
  score: number;
}

interface ResultModalProps {
  isWinner: boolean;
  open: boolean;
  rankingData: Player[];
  onClose?: () => void;
}

export const ResultModal = ({
  open,
  onClose,
  isWinner,
  rankingData,
}: ResultModalProps) => {
  const router = useRouter();
  const [ranking, _setRanking] = useState<Player[]>(rankingData);

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
            {isWinner ? "You've won the game!" : "You've lost the game"}
          </div>
          <div className="text-xl my-4">
            <p className="text-center text-2xl mb-2 font-bold">Ranking</p>
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
          <div className="mt-3 text-[#94969C] font-medium text-base">
            {isWinner
              ? "Congratulations! Your strategy and skill have prevailed. Well played!"
              : "Good effort! Learn from this match and come back stronger. Better luck next time!"}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center justify-center w-1/3"
            onClick={() => {
              router.push("/");
            }}
          >
            <img alt="" src="/svg/home.svg" />
            <div>Home</div>
          </button>
          <button
            className="rounded-full py-2.5 px-4 bg-[#F23939] text-white text-base font-semibold gap-1.5 flex items-center justify-center w-full"
            onClick={() => {
              router.push("/play");
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
