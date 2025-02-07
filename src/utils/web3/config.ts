import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient } from "@tanstack/react-query";
import { Chain } from "@rainbow-me/rainbowkit";
import { createConfig, http, injected } from "wagmi";
import { optimismSepolia } from "wagmi/chains";

import { backendStakePoolABI } from "./abi/backendStakePoolABI";
import { erc20MintABI } from "./abi/ERC20ABI";
import { walletConnect } from "wagmi/connectors";

const BACKEND_ADDRESS = "0xc9cF049a0F8B60a2d591e309aECF412F8E6Bd9b6";
const TOKEN_ADDRESS = "0xFB91F3c29F0be7A997eb4950Ea19De94C6c8D704";

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

const optimismSepoliaCustom = {
  ...optimismSepolia,
  rpcUrls: {
    default: {
      http: [
        "https://dimensional-purple-mountain.optimism-sepolia.quiknode.pro/44f0d61844a6b6e40d2c2408aef2a4dd4df22f83/",
      ],
    },
  },
};

export const config = createConfig({
  chains: [optimismSepoliaCustom],
  connectors: [
    injected(),
    walletConnect({
      projectId: "14fa4fb1d6df770d7d743a38c4c10ac9",
    }),
  ],
  transports: {
    [optimismSepoliaCustom.id]: http(),
  },
});

export const queryClient = new QueryClient();
