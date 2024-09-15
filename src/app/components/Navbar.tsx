"use client";

import Link from "next/link";
import { useState } from "react";

import useIsMobile from "../hooks/useIsMobile";

import Drawer from "./Drawer";

interface NavbarProps {
  isDark: boolean;
  onClick?: () => void;
}
export const Navbar = ({ isDark, onClick }: NavbarProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };
  const isMobile = useIsMobile();

  return (
    <div className="absolute z-50 w-full">
      <div className="flex justify-between h-20 max-w-7xl mx-auto items-center lg:px-8 px-4">
        <div className="flex gap-10 items-center">
          <img
            alt=""
            className="w-52"
            src={isDark ? "/img/chessLogoDark.svg " : "/img/chessLogo.svg"}
          />
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
          <div>
            <button className="py-2.5 px-4 shadow bg-[#F23939] rounded-full font-semibold text-base">
              Connect Wallet
            </button>
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
