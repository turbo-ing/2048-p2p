import { ethers } from 'ethers';

const swithChain = async () => {
  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const correctChain = +(process.env.NEXT_PUBLIC_CHAIN_ID as string) || 31337;
    const currentChain = (await provider.getNetwork()).chainId;

    if (currentChain === correctChain) {
      return true;
    }
    try {
      window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${correctChain.toString(16)}`,
            rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL as string],
            chainName: process.env.NEXT_PUBLIC_CHAIN_NAME as string,
            nativeCurrency: {
              name: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME as string,
              symbol: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL as string,
              decimals: 18,
            },
            blockExplorerUrls: [
              process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL as string,
            ],
          },
        ],
      });
      return true;
    } catch (error) {
      return false;
    }
  }
};

export default swithChain;
