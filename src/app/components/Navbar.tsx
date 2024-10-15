"use client";

import Link from "next/link";
import { useState } from "react";

import useIsMobile from "../hooks/useIsMobile";

import Drawer from "./Drawer";

interface NavbarProps {
  isDark: boolean;
  onClick?: () => void;
  isShowButton?: boolean;
  walletBalance?: string;
  address?: string;
}
export const Navbar = ({
  isDark,
  onClick,
  isShowButton = false,
  address,
  walletBalance,
}: NavbarProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // console.log(wallet?.provider._network.chainId);
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };
  const isMobile = useIsMobile();

  return (
    <div className="absolute z-50 w-full bg-black">
      <div className="flex justify-between h-20 max-w-7xl mx-auto items-center lg:px-8 px-4">
        <div className="flex gap-10 items-center">
          <Link href="/" onClick={onClick}>
            <img
              alt=""
              className="max-h-8"
              src={isDark ? "/svg/2048-logo.svg" : "/svg/2048-logo.svg"}
            />
          </Link>
          {!isMobile && (
            <Link
              className={`${
                isDark ? "text-white" : "text-[#475467]"
              } text-base font-semibold`}
              href="/"
              onClick={onClick}
            >
              Home
            </Link>
          )}
        </div>
        {isMobile ? (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events
          <div onClick={toggleDrawer}>
            <svg
              fill="none"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 12H21M3 6H21M3 18H21"
                stroke="#344054"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
        ) : (
          <div className="hidden">
            {isShowButton && (
              <div className="flex gap-2">
                {/* {wallet &&
                  wallet?.provider._network.chainId ===
                    process.env.NEXT_PUBLIC_CHAIN_ID && (
                    <div className="bg-white rounded-full p-2 flex gap-2">
                      <img src="/svg/chain/turbo.svg" alt="" />
                      <div>Turbo</div>
                    </div>
                  )} */}
                <div className="bg-white rounded-full p-2 flex gap-2 items-center">
                  <img alt="" src="/svg/chain/turbo.svg" />
                  <div className="text-lg font-bold text-[#25292E]">Turbo</div>
                </div>
                <div className="bg-white rounded-full py-2 px-3 flex gap-2 items-center">
                  <div className="text-lg font-bold text-[#25292E]">
                    Vault: {walletBalance} ETH
                  </div>
                </div>
                <div className="bg-white rounded-full py-2 px-3 flex gap-2 items-center">
                  <div className="text-lg font-bold text-[#25292E]">
                    {address}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Drawer
        isOpen={isDrawerOpen}
        position="right"
        toggleDrawer={toggleDrawer}
      >
        {/* Content inside the drawer */}
        <ul className="space-y-4">
          <li>
            <a className="block" href="/" onClick={onClick}>
              Home
            </a>
          </li>
        </ul>
      </Drawer>
    </div>
  );
};
