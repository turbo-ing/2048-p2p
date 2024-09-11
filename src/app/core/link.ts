import { ethers } from "ethers";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const sequencerWallet = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const abi = [
  "function getValue() public view returns (uint256)",
  "function setValue(uint256) public returns (uint256)",
];

async function linkToWallet(): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask is not installed. Please install MetaMask and try again.");

    return "";
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const privateKeyNumber = ethers.BigNumber.from(privateKey);

    let value = await contract.getValue();

    if (value.eq(0)) {
      console.log("Generated Private Key:", privateKeyNumber.toString());
      const tx = await contract.setValue(privateKeyNumber);

      try {
        await tx.wait();
      } catch (e) {
        console.error("Error while waiting for transaction confirmation:", e);
      }

      value = await contract.getValue();
    } else {
      console.log("Value is already set, skipping setValue.");
    }

    console.log("setValue transaction completed, returned value: ", value);

    const retrievedPrivateKey =
      "0x" + value.toHexString().slice(2).padStart(64, "0");

    console.log("Retrieved private key:", retrievedPrivateKey);

    return retrievedPrivateKey;
  } catch (error) {
    console.error("Error:", error);

    return "";
  }
}

export { linkToWallet };
