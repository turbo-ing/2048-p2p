import * as secp256k1 from "@noble/secp256k1";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Modal from "./Modal";

interface PlayNowProps {
  activeIndex: number;
  goToSlide: (index: number) => void;
}
export const PlayNow = ({ activeIndex }: PlayNowProps) => {
  const [selectedMode, setSelectedMode] = useState(0);
  const [isShowModal, setIsShowModal] = useState(false);
  const [addr, setAddr] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const router = useRouter();

  const onClose = () => {
    setIsShowModal(false);
    setSelectedMode(0);
  };

  const handleNextPage = () => {
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKey = secp256k1.getPublicKey(privateKey);

    sessionStorage.setItem(
      "privateKey",
      Buffer.from(privateKey).toString("hex")
    );
    sessionStorage.setItem("publicKey", Buffer.from(publicKey).toString("hex"));
    router.push(`/lobby?addr=${addr}`);
  };

  return (
    <>
      <div
        className={`absolute inset-0 w-full h-full text-black text-4xl transition-opacity duration-1000 ${
          activeIndex === 1 ? "opacity-100 z-20" : "opacity-0 z-10"
        }`}
      >
        <div className="relative flex items-center text-[#D9D9D9]">
          <div className="absolute max-w-7xl mx-auto w-full left-1/2 -translate-x-1/2 md:px-16 px-2 z-40">
            <div className="flex items-center gap-4">
              <img
                alt=""
                className="w-[72px] h-[72px]"
                src="/svg/playnow.svg"
              />
              <div className="text-6xl font-semibold">Play Now</div>
            </div>
            <div className="mt-4 text-2xl font-semibold max-w-[598px]">
              Start a quick match against a random opponent or play with
              friends.
            </div>
            <div className="mt-12">
              <button
                className="py-6 px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center"
                onClick={() => {
                  setIsShowModal(true);
                }}
              >
                <img alt="" src="/svg/Chess-Board.svg" />
                <div className="text-[#FCFCFD]">
                  <div className="text-5xl font-semibold">Play with friend</div>
                  <div className="text-[#E4E7EC] text-xl font-medium mt-1">
                    Invite a friend for a private match!
                  </div>
                </div>
              </button>
              <button
                className="py-6 px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center mt-8"
                onClick={() => {
                  router.push("/find-match");
                }}
              >
                <img alt="" src="/svg/quickMatch.svg" />
                <div className="text-[#FCFCFD]">
                  <div className="text-5xl font-semibold">Quick match</div>
                  <div className="text-[#E4E7EC] text-xl font-medium mt-1">
                    Find an opponent and start instantly!
                  </div>
                </div>
              </button>
            </div>
          </div>
          <div className="md:w-2/5 bg-black h-screen flex" />
          <div className="w-full md:w-3/5 h-screen relative">
            <div className="absolute w-full h-full bg-gradient" />
            <video
              autoPlay
              loop
              muted
              className="w-full object-cover h-full"
              src="/video/chess.mp4"
            />
          </div>
        </div>
      </div>
      <Modal show={isShowModal} onClose={onClose}>
        {selectedMode === 0 ? (
          <div>
            <img alt="" src="/svg/chessboardIcon.svg" />
            <div className="mt-4">
              <div className="text-[#F5F5F6] font-semibold text-lg">
                Play with friend
              </div>
              <div className="mt-1 text-sm text-[#94969C]">
                Invite your friends to a private chess battle or join an
                existing game room.
              </div>
            </div>
            <div className="mt-5">
              <button
                className="hover:bg-red-600 flex py-2.5 px-4 bg-[#F23939] rounded-full items-center gap-1.5 w-full justify-center"
                onClick={() => {
                  setSelectedMode(1);
                }}
              >
                <img alt="" src="/svg/magnifier.svg" />
                <div className="font-semibold text-base">Join Game</div>
              </button>
              <button
                className="hover:bg-red-600 mt-4 flex py-2.5 px-4 bg-[#F23939] rounded-full items-center gap-1.5 w-full justify-center"
                onClick={() => {
                  setSelectedMode(2);
                }}
              >
                <img alt="" src="/svg/circle-plus.svg" />
                <div className="font-semibold text-base">Ceate Room</div>
              </button>
            </div>
          </div>
        ) : selectedMode === 1 ? (
          <div>
            <img alt="" src="/svg/find-friend.svg" />
            <div className="mt-4">
              <div className="text-[#F5F5F6] font-semibold text-lg">
                Join Game
              </div>
              <div className="mt-1 text-sm text-[#94969C]">
                Connect with friends for a friendly match.
              </div>
            </div>
            <div className="mt-5">
              <div>
                <label className="text-[#CECFD2] text-sm font-medium">
                  Your name
                </label>
                <div>
                  <input
                    className="bg-[#0C111D] border border-[#333741] rounded-full shadow text-md text-[#85888E] py-2.5 px-3.5 w-full mt-1.5"
                    placeholder="Enter your name"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-5">
                <label className="text-[#CECFD2] text-sm font-medium">
                  URL
                </label>
                <div>
                  <input
                    className="bg-[#0C111D] border border-[#333741] rounded-full shadow text-md text-[#85888E] py-2.5 px-3.5 w-full mt-1.5"
                    placeholder="Enter URL"
                    type="text"
                    value={addr}
                    onChange={(e) => setAddr(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-1.5 text-[#94969C] text-sm">
                Paste the game room code here to join your friend&apos;s match.
              </div>
            </div>
            <div className="mt-8">
              <button
                className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full justify-center"
                onClick={handleNextPage}
              >
                <div className="font-semibold text-base">Join Game</div>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <img alt="" src="/svg/create-room.svg" />
            <div className="mt-4">
              <div className="text-[#F5F5F6] font-semibold text-lg">
                Create a Room
              </div>
              <div className="mt-1 text-sm text-[#94969C]">
                Set up your own chess room
              </div>
            </div>
            <div className="mt-5">
              <div>
                <label className="text-[#CECFD2] text-sm font-medium">
                  Your name
                </label>
                <div>
                  <input
                    className="bg-[#0C111D] border border-[#333741] rounded-full shadow text-md text-[#85888E] py-2.5 px-3.5 w-full mt-1.5"
                    placeholder="Enter your name"
                    type="text"
                  />
                </div>
              </div>
              <div className="mt-5">
                <label className="text-[#CECFD2] text-sm font-medium">
                  Choose Game Mode
                </label>
                <div>
                  <select className="bg-[#0C111D] border border-[#333741] rounded-full shadow text-md text-[#85888E] py-2.5 px-3.5 w-full mt-1.5">
                    <option value="classic">Classic Chess</option>
                  </select>
                </div>
              </div>
              <div className="mt-1.5 text-[#94969C] text-sm">
                Paste the game room code here to join your friend&apos;s match.
              </div>
            </div>
            <div className="mt-8">
              <button className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full justify-center">
                <div className="font-semibold text-base">Join Game</div>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
