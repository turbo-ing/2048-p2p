import { Action, initBoardWithSeed, use2048 } from "@/reducer/2048";
import { Dispatch, useEffect, useState } from "react";

export const useJoinRoom = () => {
  const [waitingToJoin, setWaitingToJoin] = useState(false);
  const [state, dispatch, connected, room, setRoom] = use2048();
  const [name, setName] = useState("");
  const [numberOfPlayers, setNumOfPlayers] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (waitingToJoin && connected) {
      const [gridBoard, zkBoard] = initBoardWithSeed(
        Math.floor(Math.random() * 100000000000),
      );

      dispatch({
        type: "JOIN",
        payload: {
          name: name,
          grid: gridBoard,
          zkBoard: zkBoard,
          numPlayers: numberOfPlayers,
        },
      });

      setWaitingToJoin(false); // Reset the waiting state
    }
  }, [waitingToJoin, connected, state, room]);

  const joinRoom = (roomId: string, name: string, numberOfPlayers?: number) => {
    setRoom(roomId);
    setName(name);
    setNumOfPlayers(numberOfPlayers);
    setWaitingToJoin(true);
  };

  return joinRoom;
};
