import { Group } from "@turbo-ing/turbo-p2p";
import { createContext, useContext } from "react";

export interface MultiplayerContextProps {
  nameInput: string;
  setNameInput: (value: string) => void;
  numOfPlayers: string;
  setNumOfPlayers: (value: string) => void;
  gameTimerInput: string;
  setGameTimerInput: (value: string) => void;
  roomIdInput: string;
  setRoomIdInput: (value: string) => void;
  minaAmount: string;
  setMinaAmount: (value: string) => void;
  onCreateNewGame: () => void;
  onJoinGame: (group: Group) => void;
  onCopyRoomCode: () => void;
  onLeaveRoom: () => void;
  state: { playersCount: number; totalPlayers: number };
  roomId: string;
  createNewRoom: () => void;
  joinRoom: () => void;
}

// Create the context
export const MultiplayerContext = createContext<MultiplayerContextProps | null>(
  null,
);

// Custom hook to use the context
export const useMultiplayerContext = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error(
      "useMultiplayerContext must be used within a MultiplayerProvider",
    );
  }
  return context;
};
