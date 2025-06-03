import { useEffect, useState } from "react";
import Button from "../Button";
import CreateRoom from "../icon/CreateRoom";
import JoinRoom from "../icon/JoinRoom";
import Input from "../Input";
import { useMultiplayerContext } from "./context";
import { Group } from "@turbo-ing/turbo-p2p";
import { use2048 } from "@/reducer/2048";

export const InviteContent = () => {
  const { joinRoom, createNewRoom } = useMultiplayerContext();

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
      <div className="mt-6 space-y-2  transition-all">
        <Button onClick={joinRoom}>
          <JoinRoom />
          <p className="font px-0.5">Join Room</p>
        </Button>
        <Button onClick={createNewRoom}>
          <CreateRoom />
          <p className="text-base px-0.5">Create Room</p>
        </Button>
      </div>
    </div>
  );
};

export const CreateRoomContent = () => {
  const {
    nameInput,
    setNameInput,
    numOfPlayers,
    setNumOfPlayers,
    gameTimerInput,
    setGameTimerInput,
    onCreateNewGame,
  } = useMultiplayerContext();

  // Force 2 players
  useEffect(() => {
    if (numOfPlayers !== "2") {
      setNumOfPlayers("2");
    }
  }, [numOfPlayers, setNumOfPlayers]);

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
        min={1}
        disabled
      />
      <Input
        labelText={"Time Limit"}
        value={gameTimerInput}
        onChange={setGameTimerInput}
        placeholder={"Enter Time Limit"}
        id={"gametimer"}
        type="number"
        min={0}
      />
      <p className="text-sm text-left mt-1 text-muted-text">
        Leave blank for no limit.
      </p>
      <div className="mt-8 space-y-2 text-white transition-all">
        <Button onClick={onCreateNewGame} disabled={!nameInput.trim()}>
          <JoinRoom />
          <p className="font text-base px-0.5">Create Room</p>
        </Button>
      </div>
    </div>
  );
};

interface LobbyWidgetProps {
  group: Group;
  onJoinGame: (group: Group) => void;
}

const LobbyWidget = ({ group, onJoinGame }: LobbyWidgetProps) => {
  // Use type assertions to access Group properties safely
  const groupAny = group as any;
  const playerCount = groupAny.peers?.length || 0;
  const maxPlayers = groupAny.config?.capacity || 2;
  const roomCode = groupAny.config?.code || groupAny.id || "Unknown";

  return (
    <div className="border border-gray-300 rounded-lg p-4 mb-3 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-lg">{roomCode}</p>
          <p className="text-sm text-gray-600">
            Players: {playerCount}/{maxPlayers}
          </p>
        </div>
        <Button
          onClick={() => onJoinGame(group)}
          disabled={playerCount >= maxPlayers}
          className="px-4 py-2"
        >
          {playerCount >= maxPlayers ? "Full" : "Join"}
        </Button>
      </div>
    </div>
  );
};

export const JoinRoomContent = () => {
  const { nameInput, setNameInput, roomIdInput, setRoomIdInput, onJoinGame } =
    useMultiplayerContext();
  const [, , , , , , getRooms] = use2048();
  const [availableRooms, setAvailableRooms] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManualJoin, setShowManualJoin] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const rooms = await getRooms("mina2048");
      setAvailableRooms(rooms);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setAvailableRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualJoin = () => {
    // Find the room by ID
    const targetRoom = availableRooms.find(
      (room) =>
        (room as any).id === roomIdInput.trim() ||
        (room as any).config?.code === roomIdInput.trim(),
    );
    if (targetRoom) {
      onJoinGame(targetRoom);
    } else {
      // If room not found in available rooms, we could try to join anyway
      console.error("Room not found in available rooms");
    }
  };

  const handleLobbyJoin = (group: Group) => {
    if (!nameInput.trim()) {
      return; // Don't join if no name
    }
    onJoinGame(group);
  };

  useEffect(() => {
    fetchRooms();
    // Refresh rooms every 5 seconds
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="mb-4">
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

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Available Rooms</h3>
          <div className="flex gap-2">
            <Button
              onClick={fetchRooms}
              disabled={loading}
              variant="inverted"
              className="px-3 py-1 text-sm"
            >
              {loading ? "..." : "Refresh"}
            </Button>
            <Button
              onClick={() => setShowManualJoin(!showManualJoin)}
              variant="inverted"
              className="px-3 py-1 text-sm"
            >
              Manual Join
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
          </div>
        )}

        {!loading && availableRooms.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No rooms available</p>
            <p className="text-sm">Create a room or try refreshing</p>
          </div>
        )}

        {!loading && availableRooms.length > 0 && (
          <div className="max-h-60 overflow-y-auto">
            {availableRooms.map((room, index) => {
              const groupAny = room as any;
              const playerCount = groupAny.peers?.length || 0;
              const maxPlayers = groupAny.config?.capacity || 2;
              const roomCode =
                groupAny.config?.code || groupAny.id || "Unknown";
              const isRoomFull = playerCount >= maxPlayers;
              const canJoin = nameInput.trim() && !isRoomFull;

              return (
                <div
                  key={(room as any).id || (room as any).config?.code || index}
                  className="border border-gray-300 rounded-lg p-4 mb-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-lg">{roomCode}</p>
                      <p className="text-sm text-gray-600">
                        Players: {playerCount}/{maxPlayers}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleLobbyJoin(room)}
                      disabled={!canJoin}
                      className="px-4 py-2"
                    >
                      {!nameInput.trim()
                        ? "Enter Name"
                        : isRoomFull
                          ? "Full"
                          : "Join"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showManualJoin && (
          <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
            <Input
              value={roomIdInput}
              onChange={setRoomIdInput}
              id={"roomcode"}
              labelText={"Room Code"}
              placeholder={"Enter code"}
            >
              <p className="text-sm text-center mt-1">
                Paste the game room code here to join your friend&apos;s match.
              </p>
            </Input>
            <div className="mt-4">
              <Button
                onClick={handleManualJoin}
                disabled={!roomIdInput.trim() || !nameInput.trim()}
              >
                <div className="font-semibold text-base">Join Game</div>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ShowRoomCodeContent = ({ onClose }: { onClose: () => void }) => {
  const { state, roomId } = useMultiplayerContext();

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
