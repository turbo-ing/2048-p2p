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
import { InputConfig } from "@turbo-ing/turbo-p2p";
import { Group, LobbyType } from "@turbo-ing/turbo-p2p";

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
  const [
    state,
    dispatch,
    rtc,
    createRoom,
    joinRoom,
    leaveRoom,
    getRooms,
    rtcConfig,
    rtcPeers,
    zkClient,
  ] = use2048();
  const [selectedMode, setSelectedMode] = useState<SelectedMode>(
    SelectedMode.INVITE_CHOICE,
  );

  const [nameInput, setNameInput] = useState<string>("");
  const [gameTimerInput, setGameTimerInput] = useState<string>("");
  const [numOfPlayers, setNumOfPlayers] = useState<string>("");
  const [roomIdInput, setRoomIdInput] = useState<string>("");
  const [minaAmount, setMinaAmount] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(true);

  const handleJoining = (loading: boolean) => {
    if (loading) {
      pushPlay();
    }
  };

  const startJoin = useJoin(handleJoining);

  useEffect(() => {
    if (!isOpen) {
      setSelectedMode(SelectedMode.INVITE_CHOICE);
      setNameInput("");
      setGameTimerInput("");
      setNumOfPlayers("");
      setRoomIdInput("");
      setIsPublic(true);
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
  const goBackToInvite = () => setSelectedMode(SelectedMode.INVITE_CHOICE);

  const joinGame = async (group: Group) => {
    await joinRoom(group);
    //wait 50 ms
    await new Promise((resolve) => setTimeout(resolve, 100));
    startJoin(rtcConfig.session?.code ?? "", nameInput);
    setSelectedMode(SelectedMode.SHOW_ROOM_CODE);
  };

  const newGame = async () => {
    let inputConfig: InputConfig = {
      general: {
        public: isPublic,
        gamespace: "mina2048",
        type: LobbyType.complete,
        capacity: parseInt(numOfPlayers),
      },
      channel: {
        game: {},
      },
      stream: {},
    };
    console.log("Creating room with input config:", inputConfig);
    await createRoom(inputConfig);
    const room = rtcConfig.session?.code;
    startJoin(
      room ?? "",
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
      minaAmount={minaAmount}
      setMinaAmount={setMinaAmount}
      isPublic={isPublic}
      setIsPublic={setIsPublic}
      onCreateNewGame={newGame}
      onJoinGame={joinGame}
      onCopyRoomCode={() =>
        navigator.clipboard.writeText(rtcConfig?.session?.code ?? "")
      }
      onLeaveRoom={onClose}
      state={state}
      roomId={rtcConfig?.session?.code ?? ""}
      createNewRoom={createNewRoom}
      joinRoom={setJoinRoom}
      goBackToInvite={goBackToInvite}
    >
      <Modal
        show={isOpen}
        onClose={onClose}
        showBackButton={selectedMode !== SelectedMode.INVITE_CHOICE}
        onBack={goBackToInvite}
      >
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
