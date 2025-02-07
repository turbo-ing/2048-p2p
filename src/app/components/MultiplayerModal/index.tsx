import { use2048, generateRoomCode } from "@/reducer/2048";
import { useState, useEffect } from "react";
import Modal from "../Modal";
import { MultiplayerProvider } from "./provider";
import { ConnectWalletClient, ConnectPublicClient } from "@/utils/wallet";
import { formatEther } from "viem";

// import { prizePoolAbi } from '@/path/to/prizePoolAbi';
// import { prizePoolAddress } from '@/path/to/addresses';
import {
  InviteContent,
  CreateRoomContent,
  JoinRoomContent,
  ShowRoomCodeContent,
  StakeContent,
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
  SUBMIT_STAKE = 3, // submit stake
  SHOW_ROOM_CODE = 4, // room code screen
}

export default function MultiplayerModal({
  isOpen,
  onClose,
  pushPlay,
}: MultiplayerModalProps) {
  const [state, dispatch, connected, roomId, setRoomId, zkClient] = use2048();
  const [selectedMode, setSelectedMode] = useState<SelectedMode>(
    SelectedMode.INVITE_CHOICE,
  );

  const [nameInput, setNameInput] = useState<string>("");
  const [gameTimerInput, setGameTimerInput] = useState<string>("");
  const [numOfPlayers, setNumOfPlayers] = useState<string>("");
  const [roomIdInput, setRoomIdInput] = useState<string>("");
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

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
    setSelectedMode(SelectedMode.SUBMIT_STAKE);
  };
  const newGame = () => {
    const room = generateRoomCode();
    joinRoom(
      room,
      nameInput,
      parseInt(numOfPlayers) ?? 1,
      parseInt(gameTimerInput) ?? 0,
    );
    setSelectedMode(SelectedMode.SUBMIT_STAKE);
  };

  const onSubmitStake = async () => {
    try {
      // Instantiate a Wallet Client and a Public Client
      const walletClient = await ConnectWalletClient();
      const publicClient = ConnectPublicClient();

      // Retrieve the wallet address using the Wallet Client
      const [address] = await walletClient.requestAddresses();
      // const [address] = await walletClient.getAddresses();

      // Retrieve the balance of the address using the Public Client
      const balance = formatEther(await publicClient.getBalance({ address }));

      // Update the state variables with the retrieved address and balance
      setAddress(address);
      setBalance(balance);
      setSelectedMode(SelectedMode.SHOW_ROOM_CODE);
    } catch (error) {
      // Error handling: Display an alert if the transaction fails
      console.error(`Transaction failed: ${error}`);
    }
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
        {selectedMode === SelectedMode.SUBMIT_STAKE && (
          <StakeContent onSubmitStake={onSubmitStake} />
        )}
        {selectedMode === SelectedMode.SHOW_ROOM_CODE && (
          <ShowRoomCodeContent onClose={onClose} />
        )}
      </Modal>
    </MultiplayerProvider>
  );
}
