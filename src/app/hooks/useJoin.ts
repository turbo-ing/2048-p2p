import { useState, useEffect } from "react";
import { use2048, initBoardWithSeed } from "@/reducer/2048";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";

export const useJoin = (handleJoinGame: (joining: boolean) => void) => {
  const [waitingToJoin, setWaitingToJoin] = useState(false);
  const [sentTimer, setSentTimer] = useState(false);
  const [name, setName] = useState("");
  const [numberOfPlayers, setNumOfPlayers] = useState<number | undefined>(
    undefined,
  );
  const [gameTimer, setGameTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false); // New state to prevent re-runs
  const [state, dispatch, connected, room, setRoom] = use2048();
  const turboEdge = useTurboEdgeV0();
  const turboEdgeConnected = turboEdge?.connected ?? false;

  // Debugging: Initial state
  useEffect(() => {
    console.log("Initial States: ", {
      waitingToJoin,
      sentTimer,
      name,
      numberOfPlayers,
      gameTimer,
      gameStarted,
      room,
      state,
      connected,
      turboEdgeConnected,
    });
  }, []);

  // Join Room Logic
  useEffect(() => {
    if (waitingToJoin && connected) {
      console.log("Attempting to join the room...");

      const [gridBoard, zkBoard] = initBoardWithSeed(
        Math.floor(Math.random() * 100000000000),
      );
      console.log("Generated boards: ", { gridBoard, zkBoard });
      console.log("number of players called", numberOfPlayers);

      dispatch({
        type: "JOIN",
        payload: {
          name,
          grid: gridBoard,
          zkBoard,
          numPlayers: numberOfPlayers,
        },
      });

      console.log("Dispatching JOIN with payload: ", {
        name,
        gridBoard,
        zkBoard,
        numPlayers: numberOfPlayers ?? 1,
      });

      setWaitingToJoin(false);
    }
  }, [waitingToJoin, connected, dispatch, name, numberOfPlayers]);

  // Game Start Logic (Single & Multiplayer)
  useEffect(() => {
    const isSinglePlayer = room.startsWith("solomode-");
    const allPlayersReady =
      state.totalPlayers > 0 && state.totalPlayers === state.playersCount;

    console.log("Checking game start conditions: ", {
      isSinglePlayer,
      allPlayersReady,
      turboEdgeConnected,
      connected,
    });

    console.log(
      "Player counts:(maxCount)",
      state.totalPlayers,
      "(in game)",
      state.playersCount,
    );

    if (allPlayersReady && turboEdgeConnected && connected) {
      console.log("All players are ready, starting game...");

      if (!isSinglePlayer && gameTimer && gameTimer > 0 && !sentTimer) {
        setSentTimer(true);
        dispatch({
          type: "TIMER",
          payload: {
            time: gameTimer,
            ended: false,
          },
        });
        console.log("Dispatching TIMER with payload: ", {
          time: gameTimer,
          ended: false,
        });
      }

      setGameStarted(true);
      console.log("Game started, redirecting to play screen...");
      handleJoinGame(true);
    } else if (!allPlayersReady) {
      console.log("Players are not ready or some conditions failed.");
      setGameStarted(false);
      handleJoinGame(false);
    }
  }, [
    room,
    state.totalPlayers,
    state.playersCount,
    turboEdgeConnected,
    connected,
    gameTimer,
    sentTimer,
    dispatch,
    gameStarted,
  ]);

  // Join Room Function
  const joinRoom = (
    roomId: string,
    playerName: string,
    numPlayers?: number,
    timer?: number,
  ) => {
    console.log("Resetting states and joining room with parameters: ", {
      roomId,
      playerName,
      numPlayers,
      timer,
    });

    // Reset relevant states
    setWaitingToJoin(false);
    setSentTimer(false);
    setName("");
    setRoom("");
    setGameTimer(0);
    setNumOfPlayers(undefined);

    // Set new game parameters
    setRoom(roomId);
    setName(playerName);
    setNumOfPlayers(numPlayers);
    setGameTimer(timer ?? 0);
    setWaitingToJoin(true);

    console.log("Updated states for joining: ", {
      room: roomId,
      name: playerName,
      numberOfPlayers: numPlayers,
      gameTimer: timer,
      waitingToJoin: true,
    });
  };

  return joinRoom;
};
