import { use2048, generateRoomCode } from "@/reducer/2048";
import { useState, useEffect } from "react";
import Modal from "../Modal";
import { MultiplayerProvider } from "./provider";
import {
  InviteContent,
  CreateRoomContent,
  JoinRoomContent,
  ShowRoomCodeContent,
} from "./Content";

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  join: (roomId: string, name: string, numberOfPlayers?: number) => void;
}

enum SelectedMode {
  INVITE_CHOICE = 0, // e.g., "Play with Friend" -> "Create or Join" choice
  CREATE_ROOM = 1, // create room
  JOIN_ROOM = 2, // join room
  SHOW_ROOM_CODE = 3, // room code screen
}

export default function MultiplayerModal({
  isOpen,
  onClose,
  join,
}: MultiplayerModalProps) {
  const [state, dispatch, connected, roomId, setRoomId, zkClient] = use2048();
  const [selectedMode, setSelectedMode] = useState<SelectedMode>(
    SelectedMode.INVITE_CHOICE,
  );

  const [nameInput, setNameInput] = useState<string>("");
  const [gameTimerInput, setGameTimerInput] = useState<string>("");
  const [numOfPlayers, setNumOfPlayers] = useState<string>("");
  const [roomIdInput, setRoomIdInput] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setNameInput("");
      setGameTimerInput("");
      setNumOfPlayers("");
      setRoomIdInput("");
    }
  }, [isOpen]);

  const createNewRoom = () => setSelectedMode(SelectedMode.CREATE_ROOM);
  const joinRoom = () => setSelectedMode(SelectedMode.JOIN_ROOM);
  const joinGame = () => {
    join(roomIdInput, nameInput);
    setSelectedMode(SelectedMode.SHOW_ROOM_CODE);
  };
  const newGame = () => {
    const room = generateRoomCode();
    join(room, nameInput, parseInt(numOfPlayers));
    setSelectedMode(SelectedMode.SHOW_ROOM_CODE);
  };

  return (
    <MultiplayerProvider
      nameInput={nameInput}
      setNameInput={setNameInput}
      numOfPlayers={numOfPlayers}
      setNumOfPlayers={setNumOfPlayers}
      gameTimerInput={gameTimerInput}
      setGameTimerInput={setGameTimerInput}
      roomIdInput={roomIdInput}
      setRoomIdInput={setRoomIdInput}
      onCreateNewGame={newGame}
      onJoinGame={joinGame}
      onCopyRoomCode={() => navigator.clipboard.writeText(roomId)}
      onLeaveRoom={onClose}
      state={state}
      roomId={roomId}
      createNewRoom={createNewRoom}
      joinRoom={joinRoom}
    >
      <Modal show={isOpen} onClose={onClose}>
        {selectedMode === SelectedMode.INVITE_CHOICE && <InviteContent />}
        {selectedMode === SelectedMode.CREATE_ROOM && <CreateRoomContent />}
        {selectedMode === SelectedMode.JOIN_ROOM && <JoinRoomContent />}
        {selectedMode === SelectedMode.SHOW_ROOM_CODE && (
          <ShowRoomCodeContent onClose={onClose} />
        )}
      </Modal>
    </MultiplayerProvider>
  );
}
