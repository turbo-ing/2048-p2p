import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateRoomCode, initializeBoard, use2048 } from "@/reducer/2048";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";

interface RoomModalProps {
  isOpen: boolean;
  closeModal: () => void;
}

const RoomModal = ({ isOpen, closeModal }: RoomModalProps) => {
  const [state, dispatch, connected, room, setRoom] = use2048();
  const turboEdge = useTurboEdgeV0();
  const peerId = turboEdge?.node.peerId.toString();

  const [step, setStep] = useState<
    "choose" | "chooseOptions" | "create" | "join" | "waiting"
  >("choose");

  const [nameInput, setNameInput] = useState("");
  //   const [gameTimesInput, setGameTimesInput] = useState(0);
  const [numOfPlayers, setNumOfPlayers] = useState(0);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const router = useRouter();

  const onClose = () => {
    closeModal();
    setRoom("");
  };

  const joinGame = async (roomId: string) => {
    setRoom(roomId);
    setStep("waiting");
  };

  const createRoom = async () => {
    setRoom(generateRoomCode());
    setStep("waiting");
  };

  const joinRoom = async () => {
    joinGame(roomIdInput);
  };

  const playWithFriend = async () => {
    setStep("chooseOptions");
  };

  const playSoloMode = async () => {
    setNumOfPlayers(1);
    setRoom(`solomode-${generateRoomCode()}`);
    router.push("/play");
  };

  useEffect(() => {
    if (connected && peerId && room) {
      dispatch({
        type: "JOIN",
        payload: {
          name: nameInput === "" ? "No Name" : nameInput,
          grid: initializeBoard(),
          numPlayers: numOfPlayers,
        },
      });
    }
  }, [connected, peerId, room, nameInput]);

  useEffect(() => {
    if (state.totalPlayers > 0) {
      if (state.totalPlayers === state.playersCount) {
        onClose();
        router.push("/play");
      }
    }
  }, [state]);

  const getTitle = () => {
    const titles = {
      choose: "Dive into 2048",
      chooseOptions: "Invite a Friend",
      create: "Create a Room",
      join: "Join a Room",
      roomCode: "Share the Room Code",
      waiting: "Waiting for Opponents",
    };

    return titles[step] || "";
  };

  const closeAndReset = () => {
    closeModal();
    setStep("choose");
    setNameInput("");
    // setGameTimesInput(0);
    setNumOfPlayers(0);
    setRoomIdInput("");
    setRoom("");
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-stone-900 bg-opacity-50 flex items-center justify-center z-[10000] text-stone-900">
        <div className="bg-white rounded-lg p-6 w-96 gap-3 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{getTitle()}</h2>
            <button
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => {
                closeAndReset();
              }}
              aria-label="Close modal"
            >
              &#10005;
            </button>
          </div>

          {/* Step Content */}
          {step === "choose" && (
            <>
              <div className="flex flex-col gap-3">
                <button
                  className="text-black border rounded px-4 py-2 hover:shadow-inner transition"
                  onClick={playSoloMode}
                >
                  Classic 2048
                </button>
                <button
                  className="text-black border rounded px-4 py-2 hover:shadow-inner transition"
                  onClick={playWithFriend}
                >
                  With Friends
                </button>
              </div>
            </>
          )}

          {step === "chooseOptions" && (
            <>
              <div className="flex flex-col gap-3">
                <button
                  className="text-black border rounded px-4 py-2 hover:shadow-inner transition"
                  onClick={() => setStep("create")}
                >
                  Create Room
                </button>
                <button
                  className="text-black border rounded px-4 py-2 hover:shadow-inner transition"
                  onClick={() => setStep("join")}
                >
                  Join Room
                </button>
              </div>
              <div className="flex justify-end gap-2 ">
                <button
                  className="text-black border rounded px-4 py-2 hover:shadow-inner transition"
                  onClick={() => setStep("choose")}
                >
                  Back
                </button>
              </div>
            </>
          )}

          {step === "create" && (
            <>
              <div className="mb-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Your Name
                </label>
                <input
                  className="p-2 px-3 rounded w-full border focus:ring-gray-500 focus:outline-none focus:ring-2 bg-white"
                  placeholder="Enter Your Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="text-sm font-medium" htmlFor="numOfPlayers">
                  Number of Players
                </label>
                <input
                  className="p-2 px-3 rounded w-full border focus:ring-gray-500 focus:outline-none focus:ring-2 bg-white"
                  placeholder="Enter Number of Players"
                  type="number"
                  min="2"
                  value={numOfPlayers || ""}
                  onChange={(e) => setNumOfPlayers(Number(e.target.value))}
                />
              </div>
              {/* <div className="mb-2">
                <label className="text-sm font-medium" htmlFor="gameTimes">
                  Game Times
                </label>
                <input
                  className="p-2 px-3 rounded w-full border focus:ring-gray-500 focus:outline-none focus:ring-2 bg-white"
                  placeholder="Enter Game Time(s)"
                  type="number"
                  value={gameTimesInput || ""}
                  onChange={(e) => setGameTimesInput(Number(e.target.value))}
                />
              </div> */}
              <div className="flex justify-end gap-2 ">
                <button
                  className="text-black border rounded px-4 py-2 hover:shadow-inner transition"
                  onClick={() => setStep("chooseOptions")}
                >
                  Back
                </button>
                <button
                  className="text-black border rounded px-4 py-2 hover:shadow-inner transition"
                  onClick={createRoom}
                >
                  Create Room
                </button>
              </div>
            </>
          )}

          {step === "join" && (
            <>
              <div className="mb-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Your Name
                </label>
                <input
                  className="p-2 px-3 rounded w-full border focus:ring-gray-500 focus:outline-none focus:ring-2 bg-white"
                  placeholder="Enter Your Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="text-sm font-medium" htmlFor="roomId">
                  Room Code
                </label>
                <input
                  className="p-2 px-3 rounded w-full border focus:ring-gray-500 focus:outline-none focus:ring-2 bg-white"
                  placeholder="Enter Room Code"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 ">
                <button
                  className="text-black border rounded px-4 py-2 hover:shadow-inner transition"
                  onClick={() => setStep("chooseOptions")}
                >
                  Back
                </button>
                <button
                  className="text-black border rounded px-4 py-2 hover:shadow-inner transition"
                  onClick={joinRoom}
                >
                  Join Room
                </button>
              </div>
            </>
          )}
          {step === "waiting" && (
            <>
              <div className="flex flex-col items-center">
                {/* Player Count */}
                <div className="border-[6px] border-[#DC3434] rounded-full w-[182px] h-[182px] justify-center flex items-center mt-4">
                  <p className="text-4xl">
                    {state.playersCount}/{state.totalPlayers}
                  </p>
                </div>

                <div className="my-4 text-center">
                  <p className="text-stone-900 font-semibold text-lg">
                    Connecting...
                  </p>
                  <p className="mt-1 text-lg text-stone-600">
                    The game will begin when all players connect using the room
                    code {room}
                  </p>
                </div>

                {/* Leave Room */}
                <div className="flex justify-end gap-2">
                  <button
                    className={`text-black border rounded px-4 py-2 hover:shadow-inner transition w-32
                    ${copySuccess && " border-success-700"}    
                    `}
                    onClick={() => handleCopyToClipboard(room)}
                  >
                    {copySuccess ? "Copied" : "Copy Code"}
                  </button>
                  <button
                    className="text-black border rounded px-4 py-2 hover:shadow-inner transition w-32"
                    onClick={() => {
                      onClose();
                      setStep("choose");
                    }}
                  >
                    Leave Room
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  );
};

export default RoomModal;
