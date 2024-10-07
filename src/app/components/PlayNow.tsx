import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { createChannel, createClient } from "nice-grpc-web";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { depositVault } from "../core/link";

import { DepositVault } from "./Deposit";
import Modal from "./Modal";

import { NodeDefinition } from "@/pb/query";
import { generateRoomCode, useChess } from "@/reducer/chess";
import { useTurboEdgeV0 } from "@turbo-ing/edge-v0";
import { useUsdtPrice } from "../contexts/UsdtPriceContext";

interface PlayNowProps {
  activeIndex: number;
  account: string;
  balance: string;
  walletBalance: string;
  setSelectedMode: Dispatch<SetStateAction<number>>;
  setAccount: Dispatch<SetStateAction<string>>;
  setWallet: Dispatch<SetStateAction<ethers.Wallet | null>>;
  setLocalPrivateKey: Dispatch<SetStateAction<string>>;
  provider: ethers.providers.Web3Provider | null;
  selectedMode: number;
  wallet: ethers.Wallet | null;
  goToSlide: (index: number) => void;
}
export const PlayNow = ({
  activeIndex,
  account,
  setSelectedMode,
  selectedMode,
  wallet,
  provider,
  setAccount,
  setLocalPrivateKey,
  setWallet,
  balance,
  walletBalance,
}: PlayNowProps) => {
  const [state, dispatch, connected, room, setRoom] = useChess();
  const turboEdge = useTurboEdgeV0();
  const peerId = turboEdge?.node.peerId.toString();

  console.log(state);

  const [isdepositModal, setIsdepositModal] = useState(false);
  const [isShowModal, setIsShowModal] = useState(false);
  const [address, setAddress] = useState("");

  const [nameInput, setNameInput] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");

  const router = useRouter();

  const usdtPrice = useUsdtPrice("ETH");

  const onClose = () => {
    setIsShowModal(false);
    setRoom("");
  };

  const _handleDepositVault = async ({ wallet }: { wallet: ethers.Wallet }) => {
    if (wallet && provider) {
      const to = await wallet.getAddress();
      const value = ethers.utils.parseEther("0.2");

      console.log(await depositVault({ provider, to, value }));
    }
  };

  // const connectWallet = async ({
  //   provider,
  // }: {
  //   provider: ethers.providers.Web3Provider;
  // }) => {
  //   try {
  //     const randomWallet = await linkToWallet({ provider });

  //     if (!randomWallet) {
  //       throw new Error("Error linking to wallet");
  //     }

  //     const localPrivate = randomWallet.retrievedPrivateKey;
  //     const localPublic = randomWallet.publicKey;

  //     setAccount(await provider.getSigner().getAddress());

  //     const wallet = new ethers.Wallet(localPrivate);

  //     setWallet(wallet);

  //     setLocalPrivateKey(localPrivate);
  //     sessionStorage.setItem("localPrivateKey", localPrivate);
  //     sessionStorage.setItem("localPublicKey", localPublic);
  //   } catch (error) {
  //     console.error("Error connecting to MetaMask:", error);
  //   }
  // };

  // const onClickConnectWallet = async () => {
  //   await connectWallet({ provider: provider! });
  // };

  const channel = createChannel(
    (process.env.NEXT_PUBLIC_CHANNEL as string) || "http://127.0.0.1:50050",
  );
  const client = createClient(NodeDefinition, channel);

  // useEffect(() => {
  //   const f = async () => {
  //     if (account) {
  //       const response = await client.isInGame({
  //         player: account,
  //       });

  //       if (response.state) {
  //         sessionStorage.setItem("whitePlayer", response.state.whitePlayer);
  //         sessionStorage.setItem("blackPlayer", response.state.blackPlayer);
  //         router.push("/play");
  //       }
  //     }
  //   };

  //   const interval = setInterval(() => {
  //     f();
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, [account]);

  const joinGameDeprecated = async () => {
    // await client.start({
    //   whitePlayer: account,
    //   blackPlayer: address,
    // });
    // sessionStorage.setItem("whitePlayer", account);
    // sessionStorage.setItem("blackPlayer", address);
    // router.push(`/play`);
  };

  // Check if both player has joined the room to start the game
  useEffect(() => {
    if (connected) {
      // If both player connected then start the game
      if (state.whitePlayer && state.blackPlayer) {
        router.push("/play");
      }

      // If the player is not joined yet then join the game
      if (!state.whitePlayer || !state.blackPlayer) {
        if (state.whitePlayer != peerId && state.blackPlayer != peerId) {
          dispatch({
            type: "JOIN",
            payload: {
              name: nameInput,
            },
          });
        }
      } else {
        if (state.whitePlayer != peerId && state.blackPlayer != peerId) {
          window.alert(
            "Another player has already joined the goom. Please create a new room.",
          );
          window.location.reload();
        }
      }
    }
  }, [state, connected, peerId, nameInput]);

  const joinGame = async (roomId: string) => {
    setRoom(roomId);
    setSelectedMode(5);
  };

  const newGame = async () => {
    joinGame(generateRoomCode());
  };

  const playWithFriend = async () => {
    setSelectedMode(3);
    setIsShowModal(true);
  };

  const joinRoom = async () => {
    setSelectedMode(4);
    setIsShowModal(true);
  };

  return (
    <>
      <div
        className={`relative inset-0 w-full h-full text-black text-4xl transition-opacity duration-1000 ${
          activeIndex === 1 ? "opacity-100 z-20" : "opacity-0 z-10"
        }`}
      >
        <img
          alt=""
          className="w-full h-full left-0 z-20 object-cover"
          src="/img/playnowbg.png"
        />
        <div className="absolute top-1/2 -translate-y-1/2 z-30 text-[#D9D9D9] w-full max-w-7xl left-1/2 -translate-x-1/2 px-4">
          <div className="flex justify-center">
            <img
              src="/svg/2048.svg"
              alt=""
              className="py-8 max-w-[286px] w-auto lg:hidden block"
            />
          </div>
          <div>
            <div className="w-full">
              <div className="flex items-center gap-4">
                <div className="lg:text-6xl text-4xl font-semibold">
                  Play Now
                </div>
              </div>
              <div className="mt-4 text-2xl font-semibold max-w-[598px]">
                Dive into the Decentralized 2048 Experience!
              </div>
            </div>
            <div className="mt-12 flex justify-between">
              <div className="md:w-1/2 w-full">
                <button
                  className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center w-full"
                  onClick={playWithFriend}
                >
                  <img
                    alt=""
                    className="w-16 h-16 lg:w-24 lg:h-24"
                    src="/svg/play-white.svg"
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
                  className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center mt-8 disabled:bg-[#b6b7b9] disabled:text-[#A3ACBB] w-full"
                  onClick={joinRoom}
                >
                  <img
                    alt=""
                    className="w-16 h-16 lg:w-24 lg:h-24"
                    src="/svg/users.svg"
                  />
                  <div
                    className="text-[#FCFCFD] text-left disabled:text-[#A3ACBB]"
                    role="button"
                    tabIndex={0}
                    onKeyDown={() => null}
                  >
                    <div className="text-2xl lg:text-5xl font-semibold">
                      Invite a Friend
                    </div>
                    <div className="text-[#E4E7EC] text-base lg:text-xl font-medium mt-1 disabled:text-[#A3ACBB]">
                      Invite a friend for a private match!
                    </div>
                  </div>
                </button>
              </div>
              <img
                src="/svg/2048.svg"
                alt=""
                className="lg:block hidden max-w-[474px] w-auto"
              />
            </div>
          </div>
        </div>
        {/* <div className="flex items-center text-[#D9D9D9] max-w-7xl mx-auto h-screen">
          <div className="w-full md:px-16 px-2 z-40">
            <div className="flex items-center gap-4">
              <div className="lg:text-6xl text-4xl font-semibold">Play Now</div>
            </div>
            <div className="mt-4 text-2xl font-semibold max-w-[598px]">
              Dive into the Decentralized 2048 Experience!
            </div>
            <div className="mt-12">
              <button
                className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center lg:w-[570px] w-[405px]"
                onClick={playWithFriend}
              >
                <img
                  alt=""
                  className="w-16 h-16 lg:w-24 lg:h-24"
                  src="/svg/play-white.svg"
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
                className="p-5 lg:py-6 lg:px-[42px] bg-[#F23939] shadow-lg rounded-full flex gap-5 items-center mt-8 disabled:bg-[#b6b7b9] disabled:text-[#A3ACBB] lg:w-[570px] w-[405px]"
                onClick={joinRoom}
              >
                <img
                  alt=""
                  className="w-16 h-16 lg:w-24 lg:h-24"
                  src="/svg/users.svg"
                />
                <div
                  className="text-[#FCFCFD] text-left disabled:text-[#A3ACBB]"
                  role="button"
                  tabIndex={0}
                  onKeyDown={() => null}
                >
                  <div className="text-2xl lg:text-5xl font-semibold">
                    Invite a Friend
                  </div>
                  <div className="text-[#E4E7EC] text-base lg:text-xl font-medium mt-1 disabled:text-[#A3ACBB]">
                    Invite a friend for a private match!
                  </div>
                </div>
              </button>
            </div>
          </div>
          <div className="md:w-3/5 flex justify-end items-center pr-16">
            <img src="/svg/2048.svg" alt="" className="" />
          </div>
        </div> */}
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
            {/* <div className="mt-5">
              <button
                className="hover:bg-red-600 flex py-2.5 px-4 bg-[#F23939] rounded-full items-center gap-1.5 w-full justify-center"
                onClick={onClickConnectWallet}
              >
                <img alt="" src="/svg/magnifier.svg" />
                <div className="font-semibold text-base">Connect wallet</div>
              </button>
            </div> */}
          </div>
        ) : selectedMode === 1 || (selectedMode === 0 && wallet) ? (
          <DepositVault
            provider={provider}
            wallet={wallet}
            balance={balance}
            usdtPrice={usdtPrice}
            walletBalance={walletBalance}
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
                onClick={joinGameDeprecated}
              >
                <div className="font-semibold text-base">Join Game</div>
              </button>
            </div>
          </div>
        ) : selectedMode === 3 || selectedMode == 4 ? (
          <div>
            <img alt="" src="/svg/create-room.svg" />
            <div className="mt-4">
              <div className="text-[#F5F5F6] font-semibold text-lg">
                {selectedMode == 3 ? "Create a Room" : "Join a Room"}
              </div>
              <div className="mt-1 text-sm text-[#94969C]">
                {selectedMode == 3
                  ? "Set up your own chess room and invite your friend"
                  : "Enter your friend's room code to start playing together"}
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
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                </div>
              </div>

              {selectedMode == 4 && (
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
                      placeholder="Enter room code"
                      type="text"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* <div className="mt-5">
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
              </div> */}
              {/* <div className="mt-1.5 text-[#94969C] text-sm">
                Paste the game room code here to join your friend&apos;s match.
              </div> */}
            </div>
            <div className="mt-8">
              <button
                className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full justify-center"
                onClick={
                  selectedMode == 3
                    ? () => newGame()
                    : () => joinGame(roomIdInput)
                }
              >
                <div className="font-semibold text-base">
                  {selectedMode == 3 ? "Create Room" : "Join Room"}
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <img alt="" src="/svg/find-friend.svg" />
            <div className="mt-4">
              <div className="text-[#F5F5F6] font-semibold text-lg">
                Waiting for opponent...
              </div>
              <div className="mt-1 text-sm text-[#94969C]">
                Share the room code below with your friend
              </div>
            </div>
            <div className="my-8 flex flex-col items-center">
              <div className="text-4xl text-center">{room}</div>

              <div className="mt-2 text-sm text-[#94969C]">
                Waiting for opponent...
              </div>
            </div>

            <div>
              <button
                className="hover:bg-red-600 py-2.5 px-4 bg-[#F23939] rounded-full w-full justify-center"
                onClick={onClose}
              >
                <div className="font-semibold text-base">Leave Room</div>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
