"use client";
import { use2048, generateRoomCode } from "@/reducer/2048";
import { useState, useEffect, ReactNode } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";

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
  const [gameTimerInput, setGameTimerInput] = useState<number>(0);
  const [numOfPlayers, setNumOfPlayers] = useState<number>(0);
  const [roomIdInput, setRoomIdInput] = useState<string>("");

  // Reset modal on close
  useEffect(() => {
    // Only reset when the modal closes
    if (!isOpen) {
      setSelectedMode(SelectedMode.INVITE_CHOICE);
      setNameInput("");
      setGameTimerInput(0);
      setNumOfPlayers(0);
      setRoomIdInput("");
    }
  }, [isOpen]);

  const createRoom = () => {
    setSelectedMode(SelectedMode.CREATE_ROOM);
  };

  const joinRoom = () => {
    setSelectedMode(SelectedMode.JOIN_ROOM);
  };

  //Join a pre-exsiting game
  const joinGame = () => {
    join(roomIdInput, nameInput);
    setSelectedMode(SelectedMode.SHOW_ROOM_CODE);
  };

  // Create a new game
  const newGame = () => {
    const room = generateRoomCode();
    join(room, nameInput, numOfPlayers);
    setSelectedMode(SelectedMode.SHOW_ROOM_CODE);
  };

  const renderContent = () => {
    switch (selectedMode) {
      case SelectedMode.INVITE_CHOICE:
        return <InviteContent />;
      case SelectedMode.CREATE_ROOM:
        return <CreateRoomContent />;
      case SelectedMode.JOIN_ROOM:
        return <JoinRoomContent />;
      case SelectedMode.SHOW_ROOM_CODE:
        return <ShowRoomCodeContent />;
      default:
        return null;
    }
  };

  const InviteContent = () => {
    return (
      <div>
        {/* <img alt="" src="/svg/create-room.svg" /> */}
        <div className="mt-2">
          <p className="font-semibold text-2xl md:text-4xl">Invite a Friend</p>
          <p className="mt-1 break-words">
            You can invite friends to a private battle or join an existing game
            room.
          </p>
        </div>
        <div className="mt-6 space-y-2 text-white transition-all">
          <Button onClick={joinRoom}>
            <img alt="" className="w-5 h-5" src="/svg/2048-join-game.svg" />
            <p className="font px-0.5">Join Room</p>
          </Button>
          <Button onClick={createRoom}>
            <img alt="" className="w-5 h-5" src="/svg/2048-create-room.svg" />
            <p className="text-base px-0.5">Create Room</p>
          </Button>
        </div>
      </div>
    );
  };

  const CreateRoomContent = () => {
    return (
      <div>
        <div className="">
          <p className="font-semibold text-2xl md:text-4xl">Create a Room</p>
          <p className="mt-1 text-sm">Set up your own room</p>
        </div>
        <Input
          labelText={"Your name"}
          value={nameInput}
          onChange={setNameInput}
          placeholder={"Enter your username"}
          id={"username"}
        />
        <Input
          labelText={"Number of players"}
          value={numOfPlayers}
          onChange={setNumOfPlayers}
          placeholder={"Enter number of players"}
          id={"number-of-players"}
          type="number"
        />
        <Input
          labelText={"Game timer"}
          value={gameTimerInput}
          onChange={setGameTimerInput}
          placeholder={"Enter Game Timer"}
          id={"gametimer"}
          type="number"
        />
        <div className="mt-8 space-y-2 text-white transition-all">
          <Button onClick={newGame}>
            <img
              alt=""
              className="w-5 h-5 text"
              src="/svg/2048-join-game.svg"
            />
            <p className="font text-base px-0.5">Create Room</p>
          </Button>
        </div>
      </div>
    );
  };

  const JoinRoomContent = () => {
    return (
      <div>
        <div className="">
          <p className="font-semibold text-2xl md:text-4xl">Join a Room</p>
          <p className="mt-1 text-sm">Join an existing game room</p>
        </div>
        <Input
          value={nameInput}
          onChange={setNameInput}
          id={"username"}
          labelText={"Your Name"}
          placeholder="Enter your name"
        />
        <Input
          value={roomIdInput}
          onChange={setRoomIdInput}
          id={"roomcode"}
          labelText={"Room Code"}
          placeholder={"Enter code"}
        >
          <p className="text-sm text-center mt-1">
            Paste the game room code here to join your friend's match.
          </p>
        </Input>
        <div className="mt-8 space-y-2 text-white transition-all">
          <Button onClick={() => joinGame()}>
            <div className="font-semibold text-base">Join Game</div>
          </Button>
        </div>
      </div>
    );
  };

  const ShowRoomCodeContent = () => {
    return (
      <div>
        <div className="">
          <p className="font-semibold text-2xl md:text-4xl">
            Share the Room Code
          </p>
          <p className="mt-1 text-sm text-[#94969C]">
            Invite a friend for a private match!
          </p>
        </div>
        <div className="flex flex-col items-center mt-10">
          <div
            className="rounded-full w-[182px] h-[182px] flex items-center justify-center transition-all"
            style={{
              background: `conic-gradient(
#edc22e ${Math.min((state.playersCount / state.totalPlayers) * 100, 100)}%, 
#e0e0e0 0
      )`,
            }}
          >
            <div
              className="bg-background rounded-full flex items-center justify-center"
              style={{
                width: "calc(182px - 20px)",
                height: "calc(182px - 20px)",
              }}
            >
              <p className="text-4xl">
                {state.playersCount}/{state.totalPlayers}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-2 gap-4 mb-4 flex flex-col items-center">
          <p className=" text-sm text-[#94969C]">Waiting for opponent</p>
          <p className="text-4xl text-center">{roomId}</p>
        </div>
        <div className="space-y-4 text-white">
          <Button
            variant="inverted"
            onClick={() => navigator.clipboard.writeText(roomId)}
          >
            Copy Room Code
          </Button>
          <Button onClick={onClose}>Leave Room</Button>
        </div>
      </div>
    );
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      {renderContent()}
    </Modal>
  );
}
