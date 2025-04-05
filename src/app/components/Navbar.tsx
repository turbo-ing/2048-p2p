"use client";

import { useAuroWallet } from "@/app/mina/useAuroWallet";
import Button from "./Button";
import { shortAddress } from "@/utils/helper";
import Wallet from "./icon/Wallet";
export default function Navbar() {
  const { address, connected, connect } = useAuroWallet();

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-end p-4">
        <div className="flex items-center gap-2">
          <Button onClick={connect}>
            <Wallet size={28} />
            &nbsp;
            {connected && address ? shortAddress(address) : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
