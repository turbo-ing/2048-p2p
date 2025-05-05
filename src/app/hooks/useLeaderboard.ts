import { Leaderboard, LeaderboardScore } from "@/utils/types";
import { zkClient } from "@/workers/zkClient";
import { useEffect, useRef } from "react";
import { useState } from "react";
import { useAuroWallet } from "../mina/useAuroWallet";

export function useLeaderboard() {
  const { address } = useAuroWallet();
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [scores, setScores] = useState<LeaderboardScore[]>([]);
  const fetching = useRef<boolean>(false);

  useEffect(() => {
    if (!fetching.current) {
      fetching.current = true;
      zkClient
        .fetchLeaderboard()
        .then((leaderboard) => {
          setScores(leaderboard);
          fetching.current = false;
        })
        .finally(() => {
          fetching.current = false;
        });
    }
  }, []);

  useEffect(() => {
    if (address) {
      setLeaderboard({
        myself: scores.find((score) => score.address === address),
        scores,
      });
    } else {
      setLeaderboard({
        myself: undefined,
        scores,
      });
    }
  }, [address, scores]);

  return { leaderboard };
}
