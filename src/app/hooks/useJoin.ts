import { useState, useEffect } from "react";
import { use2048 } from "@/reducer/2048";
import { useMinaSessionKey } from "../mina/MinaSessionKeyProvider";
import { PublicKey } from "o1js";

export const useJoin = (handleJoinGame: (joining: boolean) => void) => {
  const [waitingToJoin, setWaitingToJoin] = useState(false);
  const [sentTimer, setSentTimer] = useState(false);
  const [name, setName] = useState("");
  const [numberOfPlayers, setNumOfPlayers] = useState<number | undefined>(
    undefined,
  );
  const [gameTimer, setGameTimer] = useState(0);
  const [minaAmount, setMinaAmount] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // New state to prevent re-runs
  const [
    state,
    dispatch,
    rtc,
    createRoom, //joinRoom,
    joinRoom,
    leaveRoom,
    getRooms,
    rtcConfig,
    rtcPeers,
    zkClient,
  ] = use2048();

  const connected = (rtc && true) ?? false;

  const { sessionKey } = useMinaSessionKey();

  // Join Room Logic
  useEffect(() => {
    if (waitingToJoin && connected) {
      setTimeout(() => {
        console.log("Attempting to join the room...");

        console.log("number of players called", numberOfPlayers);

        dispatch({
          type: "JOIN",
          payload: {
            name,
            numPlayers: numberOfPlayers,
            minaAmount,
            minaSessionKey: PublicKey.fromPrivateKey(sessionKey!).toBase58(),
            isHost,
          },
        });

        console.log("Dispatching JOIN with payload: ", {
          name,
          numPlayers: numberOfPlayers ?? 1,
        });
      }, 2000);

      setWaitingToJoin(false);
    }
  }, [waitingToJoin, connected, dispatch, name, numberOfPlayers, minaAmount]);

  // Game Start Logic (Single & Multiplayer)
  useEffect(() => {
    const isSinglePlayer = rtc?.peers.length === 0;
    const allPlayersReady =
      state.totalPlayers > 0 && state.totalPlayers === state.playersCount;

    // Only check for contract deployment if minaAmount > 0
    const needsContractDeployment = state.minaAmount > 0;
    const allPlayersDeployed =
      !needsContractDeployment ||
      Object.keys(state.players).every(
        (playerId) => state.minaDeposit[playerId], //state.deployed[playerId] === true,
      );

    console.log("Checking game start conditions: ", {
      isSinglePlayer,
      allPlayersReady,
      connected,
      allPlayersDeployed,
      needsContractDeployment,
      deployed: state.deployed,
    });

    console.log(
      "Player counts:(maxCount)",
      state.totalPlayers,
      "(in game)",
      state.playersCount,
    );

    if (allPlayersReady && connected) {
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
    } else if (!allPlayersReady || (!isSinglePlayer && !allPlayersDeployed)) {
      console.log("Players are not ready or contracts not deployed.");
      setGameStarted(false);
      handleJoinGame(false);
    }
  }, [
    state.totalPlayers,
    state.playersCount,
    state.minaDeposit,
    state.minaAmount,
    connected,
    gameTimer,
    sentTimer,
    dispatch,
    gameStarted,
  ]);

  // Join Room Function
  const joinRoom2 = (
    roomId: string,
    playerName: string,
    numPlayers?: number,
    timer?: number,
    minaAmount?: number,
    isHostParam?: boolean,
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
    setGameTimer(0);
    setNumOfPlayers(undefined);
    setIsHost(false);

    // Set new game parameters
    setName(playerName);
    setNumOfPlayers(numPlayers);
    setGameTimer(timer ?? 0);
    setMinaAmount(minaAmount ?? 0); // Set minaAmount only once
    setIsHost(isHostParam ?? false); // Default to false (not host)
    setWaitingToJoin(true);

    console.log("Updated states for joining: ", {
      room: roomId,
      name: playerName,
      numberOfPlayers: numPlayers,
      gameTimer: timer,
      waitingToJoin: true,
    });
  };

  return joinRoom2;
};
