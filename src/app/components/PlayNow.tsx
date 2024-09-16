import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { createChannel, createClient } from "nice-grpc-web";
import { useEffect, useState } from "react";

import { depositVault, linkToWallet } from "../core/link";
import swithChain from "../core/switchChain";

import { DepositVault } from "./Deposit";
import Modal from "./Modal";

import { NodeDefinition } from "@/pb/query";

interface PlayNowProps {
  activeIndex: number;
  goToSlide: (index: number) => void;
}
export const PlayNow = ({ activeIndex }: PlayNowProps) => {
  const [selectedMode, setSelectedMode] = useState(0);
  const [isdepositModal, setIsdepositModal] = useState(false);
  const [isShowModal, setIsShowModal] = useState(false);
  const [account, setAccount] = useState("");
  const [address, setAddress] = useState("");
  const [localPrivateKey, setLocalPrivateKey] = useState("");
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const router = useRouter();

  const onClose = () => {
    setIsShowModal(false);
    setSelectedMode(0);
  };

  const connectWallet = async ({
    provider,
  }: {
    provider: ethers.providers.Web3Provider;
  }) => {
    try {
      const randomWallet = await linkToWallet({ provider });

      if (!randomWallet) {
        throw new Error("Error linking to wallet");
      }

      const localPrivate = randomWallet.retrievedPrivateKey;
      const localPublic = randomWallet.publicKey;

      setAccount(await provider.getSigner().getAddress());

      const wallet = new ethers.Wallet(localPrivate);

      setWallet(wallet);

      setLocalPrivateKey(localPrivate);
      sessionStorage.setItem("localPrivateKey", localPrivate);
      sessionStorage.setItem("localPublicKey", localPublic);
      setSelectedMode(1);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  const _handleDepositVault = async ({ wallet }: { wallet: ethers.Wallet }) => {
    if (wallet && provider) {
      const to = await wallet.getAddress();
      const value = ethers.utils.parseEther("0.2");

      console.log(await depositVault({ provider, to, value }));
    }
  };

  const channel = createChannel(
    (process.env.NEXT_PUBLIC_CHANNEL as string) || "http://127.0.0.1:50050",
  );
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

  const initChain = async () => {
    console.log("Init chain");
    const chainInvalid = await swithChain();

    if (!chainInvalid) {
      return;
    }

    const p = new ethers.providers.Web3Provider(window.ethereum);

    setProvider(p);
  };

  useEffect(() => {
    if (window.ethereum) {
      initChain();
    }
  }, []);

  const joinGame = async () => {
    await client.start({
      whitePlayer: account,
      blackPlayer: address,
    });
    sessionStorage.setItem("whitePlayer", account);
    sessionStorage.setItem("blackPlayer", address);
    router.push(`/play`);
  };

  const playWithFriend = async () => {
    if (window.ethereum) {
      const chainInvalid = await swithChain();

      if (!chainInvalid) {
        return;
      } else {
        setIsShowModal(true);
      }
    }
  };

  const onClickConnectWallet = async () => {
    await connectWallet({ provider: provider! });
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
                className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center lg:w-[570px] w-[405px]"
                onClick={playWithFriend}
              >
                <img
                  alt=""
                  className="w-16 h-16 lg:w-auto lg:h-auto"
                  src="/svg/Chess-Board.svg"
                />
                <div className="text-[#FCFCFD] text-left">
                  <div className="text-2xl lg:text-5xl font-semibold">
                    Play with friend
                  </div>
                  <div className="text-[#E4E7EC] text-base lg:text-xl font-medium mt-1">
                    Invite a friend for a private match!
                  </div>
                </div>
              </button>
              <button
                className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center mt-8 disabled:bg-[#b6b7b9] disabled:text-[#A3ACBB] lg:w-[570px] w-[405px]"
                onClick={() => {
                  setIsShowModal(true);
                }}
              >
                <img
                  alt=""
                  className="w-16 h-16 lg:w-auto lg:h-auto"
                  src="/svg/quickMatch.svg"
                />
                <div
                  className="text-[#FCFCFD] text-left disabled:text-[#A3ACBB]"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    router.push("find-match");
                  }}
                  onKeyDown={() => null}
                >
                  <div className="text-2xl lg:text-5xl font-semibold">
                    Quick match
                  </div>
                  <div className="text-[#E4E7EC] text-base lg:text-xl font-medium mt-1 disabled:text-[#A3ACBB]">
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
        {selectedMode === 0 && !wallet ? (
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
                onClick={onClickConnectWallet}
              >
                <img alt="" src="/svg/magnifier.svg" />
                <div className="font-semibold text-base">Connect wallet</div>
              </button>
            </div>
          </div>
        ) : selectedMode === 1 || (selectedMode === 0 && wallet) ? (
          <DepositVault
            provider={provider}
            wallet={wallet}
            onDepositCancel={() => {
              setSelectedMode(2);
            }}
            onDepositSubmit={() => {
              setSelectedMode(2);
            }}
          />
        ) : selectedMode === 2 ? (
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
                onClick={joinGame}
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
