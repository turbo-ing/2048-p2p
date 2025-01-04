import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import Modal from "./Modal";

import { generateRoomCode, initBoardWithSeed, use2048 } from "@/reducer/2048";
import ZkClient from "@/workers/zkClient";

interface PlayNowProps {
  activeIndex: number;
  setSelectedMode: Dispatch<SetStateAction<number>>;
  selectedMode: number;
  goToSlide: (index: number) => void;
}
export const PlayNow = ({
  activeIndex,
  setSelectedMode,
  selectedMode,
}: PlayNowProps) => {
  const [state, dispatch, connected, room, setRoom, zkClient, setZkClient] =
    use2048();
  const turboEdge = useTurboEdgeV0();
  const peerId = turboEdge?.node.peerId.toString();

  const [isShowModal, setIsShowModal] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [gameTimesInput, setGameTimesInput] = useState(0);
  const [numOfPlayers, setNumOfPlayers] = useState(0);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const onClose = () => {
    setIsShowModal(false);
    setRoom("");
  };

  const joinGame = async (roomId: string) => {
    setRoom(roomId);
    setSelectedMode(4);
  };

  const createRoom = async () => {
    setSelectedMode(1);
    setIsShowModal(true);
  };

  const joinRoom = async () => {
    setSelectedMode(2);
    setIsShowModal(true);
  };

  const newGame = async () => {
    setRoom(generateRoomCode());
    setSelectedMode(3);
  };

  const playWithFriend = async () => {
    setSelectedMode(0);
    setIsShowModal(true);
  };

  const playSoloMode = async () => {
    setIsLoading(true);
    const result = await zkClient?.compileZKProgram();
    console.log("Verification Key", result?.verificationKey);
    setRoom("solomode-" + generateRoomCode());
    setNumOfPlayers(1);
  };

  useEffect(() => {
    if (connected && peerId && room) {
      // check condition to dispatch JOIN event
      const [gridBoard, zkBoard] = initBoardWithSeed(
        Math.floor(Math.random() * 100000000000),
      );

      dispatch({
        type: "JOIN",
        payload: {
          name: nameInput === "" ? "No Name" : nameInput,
          grid: gridBoard,
          zkBoard: zkBoard,
          numPlayers: numOfPlayers,
        },
      });
    }
  }, [connected, peerId, room, nameInput]);

  useEffect(() => {
    console.log("state", state);
    if (state.totalPlayers > 0) {
      if (state.totalPlayers === state.playersCount) {
        setIsShowModal(false);
        router.push("/play");
      }
    }
  }, [state]);

  useEffect(() => {
    setZkClient(new ZkClient());
  }, []);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-white border-opacity-75" />
          </div>
        </div>
      )}
      <div
        className={`absolute inset-0 w-full h-full text-[#D9D9D9] text-4xl transition-opacity duration-1000 ${
          activeIndex === 1 ? "opacity-100 z-20" : "opacity-0 z-10"
        }`}
      >
        <div
          className="h-full"
          style={{
            backgroundImage: "url('/img/2048-lobby-bg.png')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="md:grid md:grid-cols-2 md:gap-4 md:content-center h-full text-white md:pt-20 lg:px-8 px-4 max-w-7xl mx-auto pt-28">
            <div className="md:order-last flex items-center justify-center mb-8 md:mb-0">
              <div>
                <img
                  alt=""
                  className="md:max-h-40 max-h-32"
                  src="/img/2048_bg.png"
                />
              </div>
            </div>
            <div>
              <div>
                <p className="text-6xl font-semibold mb-4">Play Now</p>
                <p className="text-2xl font-semibold">
                  Dive into the Decentralized 2048 Experience!
                </p>
              </div>
              <div className="mt-12 space-y-8">
                <button
                  className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center w-full"
                  disabled={!turboEdge}
                  onClick={playSoloMode}
                >
                  <img
                    alt=""
                    className="w-16 h-16 lg:w-auto lg:h-auto"
                    src="/svg/2048-play.svg"
                  />
                  <div className="text-[#FCFCFD] text-left">
                    <div className="text-2xl lg:text-5xl font-semibold">
                      Classic 2048
                    </div>
                    <div className="text-[#E4E7EC] text-base lg:text-xl font-medium mt-1">
                      Challenge Yourself!
                    </div>
                  </div>
                </button>
                <button
                  className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center w-full"
                  disabled={!turboEdge}
                  onClick={playWithFriend}
                >
                  <img
                    alt=""
                    className="w-16 h-16 lg:w-auto lg:h-auto"
                    src="/svg/2048-invite.svg"
                  />
                  <div className="text-[#FCFCFD] text-left">
                    <div className="text-2xl lg:text-5xl font-semibold">
                      Invite a Friend
                    </div>
                    <div className="text-[#E4E7EC] text-base lg:text-xl font-medium mt-1">
                      Invite a friend for a private match!
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal show={isShowModal} onClose={onClose}>
        {selectedMode === 0 ? (
          // handle first popup choose create or join room
          <div>
            <img alt="" src="/svg/create-room.svg" />
            <div className="mt-4">
              <p className="text-[#F5F5F6] font-semibold text-lg">
                Invite a Friend
              </p>
              <p className="mt-1 text-sm text-[#94969C]">
                Your can invite 3 friends to a private battle or join an
                existing game room.
              </p>
            </div>
            <div className="mt-8 space-y-4">
              <button
                className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full flex items-center justify-center"
                onClick={joinRoom}
              >
                <img alt="" className="w-5 h-5" src="/svg/2048-join-game.svg" />
                <p className="font-semibold text-base px-0.5">Join Room</p>
              </button>
              <button
                className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full flex items-center justify-center"
                onClick={createRoom}
              >
                <img
                  alt=""
                  className="w-5 h-5"
                  src="/svg/2048-create-room.svg"
                />
                <p className="font-semibold text-base px-0.5">Create Room</p>
              </button>
            </div>
          </div>
        ) : selectedMode === 1 ? (
          // handle create room
          <div>
            <img alt="" src="/svg/create-room.svg" />
            <div className="mt-4">
              <p className="text-[#F5F5F6] font-semibold text-lg">
                Create a Room
              </p>
              <p className="mt-1 text-sm text-[#94969C]">
                Set up your own room
              </p>
            </div>
            <div className="mt-5">
              <label
                className="text-[#CECFD2] text-sm font-medium"
                htmlFor="username"
              >
                Your name
              </label>
              <div>
                <input
                  className="bg-[#0C111D] border border-[#333741] rounded-full shadow text-md text-[#85888E] py-2.5 px-3.5 w-full mt-1.5"
                  placeholder="Enter your name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-5">
              <label
                className="text-[#CECFD2] text-sm font-medium"
                htmlFor="number-of-players"
              >
                Number of players
              </label>
              <div>
                <input
                  className="bg-[#0C111D] border border-[#333741] rounded-full shadow text-md text-[#85888E] py-2.5 px-3.5 w-full mt-1.5"
                  placeholder="Enter number of players"
                  type="text"
                  value={numOfPlayers}
                  onChange={(e) => setNumOfPlayers(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-5">
              <label
                className="text-[#CECFD2] text-sm font-medium"
                htmlFor="gametimes"
              >
                Game times
              </label>
              <div>
                <input
                  className="bg-[#0C111D] border border-[#333741] rounded-full shadow text-md text-[#85888E] py-2.5 px-3.5 w-full mt-1.5"
                  placeholder="Enter Game Times (s)"
                  type="text"
                  value={gameTimesInput}
                  onChange={(e) => setGameTimesInput(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-8 spacing-x-2">
              <button
                className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full justify-center"
                onClick={newGame}
              >
                <div className="font-semibold text-base">Create Room</div>
              </button>
            </div>
          </div>
        ) : selectedMode === 2 ? (
          // handle join room
          <div>
            <img alt="" src="/svg/find-friend.svg" />
            <div className="mt-4">
              <p className="text-[#F5F5F6] font-semibold text-lg">
                Create a Room
              </p>
              <p className="mt-1 text-sm text-[#94969C]">
                Set up your own room
              </p>
            </div>
            <div className="mt-5">
              <label
                className="text-[#CECFD2] text-sm font-medium"
                htmlFor="username"
              >
                Your name
              </label>
              <div>
                <input
                  className="bg-[#0C111D] border border-[#333741] rounded-full shadow text-md text-[#85888E] py-2.5 px-3.5 w-full mt-1.5"
                  placeholder="Enter your name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-5">
              <label
                className="text-[#CECFD2] text-sm font-medium"
                htmlFor="username"
              >
                Room Code
              </label>
              <div>
                <input
                  className="bg-[#0C111D] border border-[#333741] rounded-full shadow text-md text-[#85888E] py-2.5 px-3.5 w-full mt-1.5"
                  placeholder="Enter code"
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                />
                <p className="text-sm text-[#94969C]">
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  Paste the game room code here to join your friend's match.
                </p>
              </div>
            </div>
            <div className="mt-8 spacing-x-2">
              <button
                className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full justify-center"
                onClick={() => joinGame(roomIdInput)}
              >
                <div className="font-semibold text-base">Join Game</div>
              </button>
            </div>
          </div>
        ) : selectedMode === 3 ? (
          // show room code
          <div>
            <img alt="" src="/svg/find-friend.svg" />
            <div className="mt-4">
              <div className="text-[#F5F5F6] font-semibold text-lg">
                Share the room code
              </div>
              <div className="mt-1 text-sm text-[#94969C]">
                Invite a friend for a private match!
              </div>
            </div>
            <div className="my-8 flex flex-col items-center">
              <p className="text-4xl text-center text-[#F5F5F6]">{room}</p>

              <p className="mt-2 text-sm text-[#94969C]">
                Waiting for opponent...
              </p>
            </div>

            <div className="space-y-4">
              <button
                className="hover:bg-red-600 py-2.5 px-4 bg-white rounded-full w-full justify-center"
                onClick={() => navigator.clipboard.writeText(room)}
              >
                <div className="font-semibold text-base text-[#344054]">
                  Copy code
                </div>
              </button>
              <button
                className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full justify-center"
                onClick={onClose}
              >
                <div className="font-semibold text-base">Leave Room</div>
              </button>
            </div>
          </div>
        ) : (
          // waiting for opponent
          <div className="flex flex-col items-center mt-20">
            <div className="border-[6px] border-[#DC3434] rounded-full w-[182px] h-[182px] justify-center flex items-center">
              <p className="text-4xl">
                {state.playersCount}/{state.totalPlayers}
              </p>
            </div>
            <div className="my-8 mt-8 text-center">
              <p className="text-[#F5F5F6] font-semibold text-lg">
                Connecting...
              </p>
              <p className="mt-1.5 text-lg text-white">
                The game will begin when all players are present
              </p>
            </div>
            <button
              className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full justify-center"
              onClick={onClose}
            >
              <div className="font-semibold text-base">Start Game</div>
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};
