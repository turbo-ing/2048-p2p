import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { createChannel, createClient } from "nice-grpc-web";
import { useEffect, useState } from "react";

import { depositVault, linkToWallet } from "../core/link";

import Modal from "./Modal";

import { NodeDefinition } from "@/pb/query";

interface PlayNowProps {
  activeIndex: number;
  goToSlide: (index: number) => void;
}
export const PlayNow = ({ activeIndex }: PlayNowProps) => {
  const [selectedMode, setSelectedMode] = useState(0);
  const [isShowModal, setIsShowModal] = useState(false);
  const [account, setAccount] = useState("");
  const [address, setAddress] = useState("");
  const [localPrivateKey, setLocalPrivateKey] = useState("");
  const router = useRouter();

  const onClose = () => {
    setIsShowModal(false);
    setSelectedMode(0);
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const localPrivate = await linkToWallet(provider);

        setLocalPrivateKey(localPrivate);
        sessionStorage.setItem("localPrivateKey", localPrivate);

        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const userAccount = await signer.getAddress();

        setAccount(userAccount);
        return localPrivate;
      } else {
        alert(
          "MetaMask is not installed. Please install MetaMask and try again.",
        );
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  const channel = createChannel(`http://127.0.0.1:50050`);
  const client = createClient(NodeDefinition, channel);

  useEffect(() => {
    const f = async () => {
      if (account) {
        const response = await client.isInGame({
          player: account,
        });

        if (response.state) {
          sessionStorage.setItem("whitePlayer", response.state.whitePlayer);
          sessionStorage.setItem("blackPlayer", response.state.blackPlayer);
          router.push("/play");
        }
      }
    };

    const interval = setInterval(() => {
      f();
    }, 5000);

    return () => clearInterval(interval);
  }, [account]);

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
                className="lg:w-[72px] lg:h-[72px] w-16 h-16"
                src="/svg/playnow.svg"
              />
              <div className="lg:text-6xl text-4xl font-semibold">Play Now</div>
            </div>
            <div className="mt-4 text-2xl font-semibold max-w-[598px]">
              Start a quick match against a random opponent or play with
              friends.
            </div>
            <div className="mt-12">
              <button
                className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center"
                onClick={() => {
                  setIsShowModal(true);
                }}
              >
                <img
                  alt=""
                  src="/svg/Chess-Board.svg"
                  className="w-16 h-16 lg:w-auto lg:h-auto"
                />
                <div className="text-[#FCFCFD] text-left lg:text-center">
                  <div className="text-2xl lg:text-5xl font-semibold">
                    Play with friend
                  </div>
                  <div className="text-[#E4E7EC] text-base lg:text-xl font-medium mt-1">
                    Invite a friend for a private match!
                  </div>
                </div>
              </button>
              <button
                className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center mt-8"
                onClick={() => {
                  setIsShowModal(true);
                }}
              >
                <img
                  alt=""
                  src="/svg/quickMatch.svg"
                  className="w-16 h-16 lg:w-auto lg:h-auto"
                />
                <div className="text-[#FCFCFD] text-left lg:text-center">
                  <div className="text-2xl lg:text-5xl font-semibold">
                    Quick match
                  </div>
                  <div className="text-[#E4E7EC] text-base lg:text-xl font-medium mt-1">
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
                Connect your MetaMask wallet and start playing with friends!
              </div>
            </div>
            <div className="mt-5">
              <button
                className="hover:bg-red-600 flex py-2.5 px-4 bg-[#F23939] rounded-full items-center gap-1.5 w-full justify-center"
                onClick={async () => {
                  const localPrivateKey = await connectWallet();

                  // todo! make normal vault deposit
                  if (localPrivateKey) {
                    const wallet = new ethers.Wallet(localPrivateKey);
                    const to = await wallet.getAddress();
                    const value = ethers.utils.parseEther("0.1");
                    const provider = new ethers.providers.Web3Provider(
                      window.ethereum,
                    );

                    await depositVault({ provider, to, value });

                    setSelectedMode(1);
                  }
                }}
              >
                <img alt="" src="/svg/magnifier.svg" />
                <div className="font-semibold text-base">Connect wallet</div>
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
                <label
                  className="text-[#CECFD2] text-sm font-medium"
                  htmlFor="wallet"
                >
                  Invite your friend below or wait for an invitation here.
                  <br />
                  Your address: {account}
                </label>
                <div>
                  <input
                    className="bg-[#0C111D] border border-[#333741] rounded-full shadow text-md text-[#85888E] py-2.5 px-3.5 w-full mt-1.5"
                    placeholder="Enter your friend's address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="mt-8">
              <button
                className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full justify-center"
                onClick={async () => {
                  await client.start({
                    whitePlayer: account,
                    blackPlayer: address,
                  });
                  sessionStorage.setItem("whitePlayer", account);
                  sessionStorage.setItem("blackPlayer", address);
                  router.push(`/play`);
                }}
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
                  />
                </div>
              </div>
              <div className="mt-5">
                <label
                  className="text-[#CECFD2] text-sm font-medium"
                  htmlFor="gameMode"
                >
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
