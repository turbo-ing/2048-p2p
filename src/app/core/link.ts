import { ethers } from "ethers";

import { abi } from "./abi/Chess.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const sequencerWallet = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

async function linkToWallet(
  provider: ethers.providers.Web3Provider,
): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask is not installed. Please install MetaMask and try again.");

    return "";
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const privateKeyNumber = ethers.BigNumber.from(privateKey);

    try {
      const tx = await contract.setValue(privateKeyNumber);

      await tx.wait();
    } catch (e) {
      console.error("Error while waiting for transaction confirmation:", e);
    }

    const value = await contract.getValue();

    const retrievedPrivateKey =
      "0x" + value.toHexString().slice(2).padStart(64, "0");

    return retrievedPrivateKey;
  } catch (error) {
    console.error("Error:", error);

    return "";
  }
}

interface DepositVaultParams {
  provider: ethers.providers.Web3Provider;
  to: string;
  value: ethers.BigNumberish;
}

async function depositVault({
  provider,
  to,
  value = ethers.utils.parseEther("0.0001"),
}: DepositVaultParams): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask is not installed. Please install MetaMask and try again.");

    return "";
  }

  try {
    const txn = await provider.getSigner().sendTransaction({
      to,
      value,
      maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"),
      gasLimit: ethers.BigNumber.from(21000),
      type: 2,
    });

    await txn.wait();

    return txn.hash;
  } catch (e) {
    console.error("Error while waiting for transaction confirmation:", e);

    return "";
  }
}

export { linkToWallet, depositVault, sequencerWallet };
