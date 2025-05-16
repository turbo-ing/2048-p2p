import { useState } from "react";
import { useLeaderboard } from "../hooks/useLeaderboard";
import Modal from "./Modal";
import { shortAddress } from "@/utils/helper";
import { TileMinimal } from "./TileMinimal";

const PAGE_SIZE = 10;

export default function LeaderboardModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { leaderboard } = useLeaderboard();
  const [page, setPage] = useState(0);
  const leaderboardSlice =
    leaderboard?.scores.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) || [];

  console.log("Leaderboard", leaderboard);

  return (
    <Modal show={open} onClose={onClose}>
      <div>
        <h2 className="font-semibold text-2xl md:text-4xl text-center">
          Leaderboard
        </h2>
        <div className="mt-4">
          <div className="leaderboard-row">
            <div></div>
            <div></div>
            <div className="text-right font-bold">Total</div>
            <div className="text-right font-bold">Best</div>
          </div>

          {leaderboardSlice.map((score) => (
            <div className="leaderboard-row -ml-3" key={score.address}>
              <div
                className="text-center font-bold"
                style={{ fontSize: score.rank >= 1000 ? 14 : 16 }}
              >
                #{score.rank}
              </div>
              <div className="flex flex-row items-center">
                <div className="mr-2">
                  <TileMinimal
                    tile={score.maxTile}
                    cellSize={36}
                    gap={2}
                    fontSize={score.maxTile >= 1000 ? 12 : 16}
                  ></TileMinimal>
                </div>
                {shortAddress(score.address)}
              </div>
              <div className="text-right">{score.totalScore}</div>
              <div className="text-right">{score.maxScore}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
