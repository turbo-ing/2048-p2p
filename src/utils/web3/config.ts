import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient } from "@tanstack/react-query";
import { Chain } from "@rainbow-me/rainbowkit";
import { createConfig, http, injected } from "wagmi";
import { optimismSepolia } from "wagmi/chains";

import { backendStakePoolABI } from "./abi/backendStakePoolABI";
import { erc20MintABI } from "./abi/ERC20ABI";
import { walletConnect } from "wagmi/connectors";

const BACKEND_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_ADDRESS;
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_ERC20_TOKEN;

if (!BACKEND_ADDRESS || !TOKEN_ADDRESS) {
  throw new Error("Missing Contract Addresses");
}

export const contracts = {
  backendStakePool: {
    address: BACKEND_ADDRESS as `0x${string}`,
    abi: backendStakePoolABI,
  },
  erc20Token: {
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: erc20MintABI,
  },
};

if (!process.env.NEXT_PUBLIC_RPC_URL) {
  throw new Error("Missing RPC URL");
}

const optimismSepoliaCustom = {
  ...optimismSepolia,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.optimism.io"],
    },
  },
};

if (!process.env.NEXT_PUBLIC_PROJECT_ID) {
  throw new Error("Missing RainbowKit Project ID");
}

export const config = createConfig({
  chains: [optimismSepoliaCustom],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "",
    }),
  ],
  transports: {
    [optimismSepoliaCustom.id]: http(),
  },
});

export const queryClient = new QueryClient();
