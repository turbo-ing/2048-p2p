"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import Modal from "./Modal";
import { use2048 } from "@/reducer/2048";

export interface Player {
  name: string;
  score: number;
}

interface ResultModalProps {
  rematch: () => void;
  rem: number;
  surrendered: { [playerId: string]: boolean };
  allSurrendered: boolean;
  downloadProof: () => void;
  lenQueue: number;
  leave: () => void;
  player: String;
  isWinner: boolean;
  open: boolean;
  totalPlayers: number;
  rankingData: Player[];
  onClose?: () => void;
}

export const ResultModal = ({
  rematch,
  rem,
  surrendered,
  allSurrendered,
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
  const [download, setDownload] = useState<boolean>(false);

  return (
    <div>
      <Modal show={open}>
        {!download && (
          <div>
            <div className="relative flex justify-center items-center">
              <img
                alt=""
                src={isWinner ? "/svg/2048-winner.svg" : "/svg/2048-loser.svg"}
              />
            </div>
            <div className="py-6 text-center">
              <div className="text-[#F5F5F6] font-semibold text-3xl">
                {totalPlayers > 1 &&
                  !allSurrendered &&
                  (player == ranking[0].name
                    ? "You've won the match!"
                    : "You've been beaten!")}
                {totalPlayers > 1 &&
                  allSurrendered &&
                  "All opponents surrendered!"}
                {totalPlayers < 2 && (isWinner ? "You win!" : "Game over!")}
              </div>
              <div className="text-xl my-4">
                <p className="text-center text-2xl mb-2 font-bold">
                  {totalPlayers > 1 && "Ranking"}
                </p>
                <ul className="counter-list">
                  {totalPlayers > 1 &&
                    ranking.map((player) => (
                      <li
                        key={player.name}
                        className="flex justify-between relative px-5 mb-2 last:mb-0"
                      >
                        <p>{player.name}</p>
                        {!surrendered[player.name!] && <p>{player.score}</p>}
                        {surrendered[player.name!] && <p>Surrendered!</p>}
                      </li>
                    ))}
                  {totalPlayers < 2 && "Score: " + ranking[0].score}
                </ul>
              </div>
              <div className="mt-3 text-[#94969C] font-medium text-base">
                {totalPlayers > 1 &&
                  (player == ranking[0].name
                    ? "Congratulations! Your strategy and skill have prevailed. Well played!"
                    : "Good effort! Learn from this match and come back stronger. Better luck next time!")}
                {totalPlayers < 2 &&
                  (isWinner
                    ? "You're officially a 2048 master!"
                    : "Better luck next time!")}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center justify-center w-1/3"
                onClick={() => leave()}
              >
                <img alt="" src="/svg/home.svg" />
                <div>Home</div>
              </button>
              <button
                className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center justify-center w-full"
                onClick={() => setDownload(true)} //downloadProof()
              >
                <div>Download ZK Proof</div>
              </button>
              <button
                className="rounded-full py-2.5 px-4 bg-[#F23939] text-white text-base font-semibold gap-1.5 flex items-center justify-center w-2/3"
                onClick={() => {
                  rematch(); //router.push("/");
                }}
              >
                <img alt="" src="/svg/repeat.svg" />
                <div>
                  {totalPlayers < 2 && "Play again"}
                  {totalPlayers > 1 &&
                    "Rematch (" + rem + "/" + totalPlayers + ")"}
                </div>
              </button>
            </div>
          </div>
        )}
        {download && lenQueue === 0 && (
          <div>
            <div className="relative flex justify-center items-center">
              <img alt="" src={"/svg/circle-plus.svg"} />
            </div>
            <div className="py-6 text-center">
              <div className="text-[#F5F5F6] font-semibold text-3xl">
                Download ZK Proof
              </div>
              <div className="relative flex justify-center items-center">
                <button
                  className="rounded-full m-5 py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center justify-center w-2/5"
                  onClick={() => downloadProof()}
                >
                  <div>Download Proof</div>
                </button>
                <button
                  className="rounded-full m-5 py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center justify-center w-2/5"
                  onClick={() => setDownload(false)} //downloadProof()
                >
                  <div>Back to Results</div>
                </button>
              </div>
            </div>
          </div>
        )}
        {download && lenQueue !== 0 && (
          <div>
            <div className="relative flex justify-center items-center">
              <img alt="" src={"/svg/circle-plus.svg"} />
            </div>
            <div className="py-6 text-center">
              <div className="text-[#F5F5F6] font-semibold text-3xl">
                Generating ZK Proof... Moves left to process: {lenQueue}
              </div>
              <div className="relative flex justify-center items-center">
                <button
                  className="rounded-full mt-4 py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center justify-center"
                  onClick={() => setDownload(false)} //downloadProof()
                >
                  <div>Back to Results</div>
                </button>
              </div>
              <div className="text-xl my-4">
                <p className="text-center text-2xl mb-2 font-bold">
                  {totalPlayers > 1 && "Ranking"}
                </p>
                <ul className="counter-list">
                  {totalPlayers > 1 &&
                    ranking.map((player) => (
                      <li
                        key={player.name}
                        className="flex justify-between relative px-5 mb-2 last:mb-0"
                      >
                        <p>{player.name}</p>
                        <p>{player.score}</p>
                      </li>
                    ))}
                  {totalPlayers < 2 && "Score: " + ranking[0].score}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
