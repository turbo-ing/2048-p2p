import { QueryClient } from "@tanstack/react-query";
import { http, injected } from "wagmi";
import { createConfig } from "@privy-io/wagmi";
import { optimismSepolia } from "wagmi/chains";

import { backendStakePoolABI } from "./abi/backendStakePoolABI";
import { erc20MintABI } from "./abi/ERC20ABI";
import { walletConnect } from "wagmi/connectors";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { toPrivyWallet } from "@privy-io/cross-app-connect/rainbow-kit";

const BACKEND_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_STAKE_POOL;
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

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        toPrivyWallet({
          id: "cm6a9um83004rl2fofswzt8sp", //process.env.NEXT_PUBLIC_PRIVY_APP_ID
          name: "Turbo 2048",
          iconUrl:
            "https://upload.wikimedia.org/wikipedia/en/5/5f/Original_Doge_meme.jpg",
        }),
      ],
    },
  ],
  {
    appName: "Privy",
    projectId: "Demo",
  },
);

export const config = createConfig({
  chains: [optimismSepoliaCustom],
  transports: {
    [optimismSepoliaCustom.id]: http(),
  },
  connectors,
  ssr: true,
  /*connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "",
    }),
  ],*/
});

export const queryClient = new QueryClient();
