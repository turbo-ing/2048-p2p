import Button from "../Button";
import CreateRoom from "../icon/CreateRoom";
import JoinRoom from "../icon/JoinRoom";
import Input from "../Input";
import { useMultiplayerContext } from "./context";

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
        <Button onClick={onCreateNewGame}>
          <JoinRoom />
          <p className="font text-base px-0.5">Create Room</p>
        </Button>
      </div>
    </div>
  );
};

export const JoinRoomContent = () => {
  const { nameInput, setNameInput, roomIdInput, setRoomIdInput, onJoinGame } =
    useMultiplayerContext();
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
          Paste the game room code here to join your friend&apos;s match.
        </p>
      </Input>
      <div className="mt-8 space-y-2 text-white transition-all">
        <Button onClick={() => onJoinGame()}>
          <div className="font-semibold text-base">Join Game</div>
        </Button>
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
