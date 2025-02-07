export const backendStakePoolABI = [
  {
    name: "getBalanceOf",
    type: "function",
    inputs: [
      {
        name: "walletAddress",
        type: "address",
      },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "stake",
    type: "function",
    inputs: [
      {
        name: "namespace",
        type: "bytes32",
      },
    ],
    outputs: [],
  },
  {
    name: "finalise",
    type: "function",
    inputs: [
      {
        name: "namespace",
        type: "bytes32",
      },
      {
        name: "winnerAddress",
        type: "address",
      },
      {
        name: "signature",
        type: "bytes",
      },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;
