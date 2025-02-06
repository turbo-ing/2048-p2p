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
import { useJoin } from "@/app/hooks/useJoin";
import { useRouter } from "next/router";

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pushPlay: () => void;
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
  pushPlay,
}: MultiplayerModalProps) {
  const [state, dispatch, connected, roomId, setRoomId, zkClient4] = use2048();
  const [selectedMode, setSelectedMode] = useState<SelectedMode>(
    SelectedMode.INVITE_CHOICE,
  );

  const [nameInput, setNameInput] = useState<string>("");
  const [gameTimerInput, setGameTimerInput] = useState<string>("");
  const [numOfPlayers, setNumOfPlayers] = useState<string>("");
  const [roomIdInput, setRoomIdInput] = useState<string>("");

  const handleJoining = (loading: boolean) => {
    if (loading) {
      pushPlay();
    }
  };

  const joinRoom = useJoin(handleJoining);

  useEffect(() => {
    if (!isOpen) {
      setSelectedMode(SelectedMode.INVITE_CHOICE);
      setNameInput("");
      setGameTimerInput("");
      setNumOfPlayers("");
      setRoomIdInput("");
      // if (connected) {
      //   setRoomId("");
      //   dispatch({
      //     type: "LEAVE",
      //   });
      // }
    }
  }, [isOpen]);

  const createNewRoom = () => setSelectedMode(SelectedMode.CREATE_ROOM);
  const setJoinRoom = () => setSelectedMode(SelectedMode.JOIN_ROOM);
  const joinGame = () => {
    joinRoom(roomIdInput, nameInput);
    setSelectedMode(SelectedMode.SHOW_ROOM_CODE);
  };
  const newGame = () => {
    const room = generateRoomCode();
    joinRoom(
      room,
      nameInput,
      parseInt(numOfPlayers) ?? 1,
      parseInt(gameTimerInput) ?? 0,
    );
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
      joinRoom={setJoinRoom}
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
