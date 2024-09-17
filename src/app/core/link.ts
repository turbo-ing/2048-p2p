import { ethers } from 'ethers';

import { abi } from './abi/Chess.json';

const contractAddress =
  (process.env.NEXT_PUBLIC_CHESS_CONTRACT as string) ||
  '0x032f5B3A053d21Fa6F6f7242F6B3670f981d156f';
const sequencerWallet =
  (process.env.NEXT_PUBLIC_SEQUENCER_WALLET as string) ||
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

async function linkToWallet({
  provider,
}: {
  provider: ethers.providers.Web3Provider;
}): Promise<{ retrievedPrivateKey: string; publicKey: string } | undefined> {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask is not installed. Please install MetaMask and try again.');

    return undefined;
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const signer = provider.getSigner();

    console.log(signer.getAddress());
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;

    const privateKeyNumber = ethers.BigNumber.from(privateKey);

    try {
      const tx = await contract.setValue(privateKeyNumber);

      await tx.wait();
    } catch (e) {
      console.error('Error while waiting for transaction confirmation:', e);
    }

    const value = await contract.getValue();

    const retrievedPrivateKey =
      '0x' + value.toHexString().slice(2).padStart(64, '0');

    return { retrievedPrivateKey, publicKey: wallet.address };
  } catch (error) {
    console.error('Error:', error);

    return undefined;
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
  value,
}: DepositVaultParams): Promise<string> {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask is not installed. Please install MetaMask and try again.');

    return '';
  }
  //

  try {
    const txn = await provider.getSigner().sendTransaction({
      to,
      value,
      // maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"),
      // gasLimit: ethers.BigNumber.from(21000),
      type: 2,
    });

    await txn.wait();

    return txn.hash;
  } catch (e) {
    console.error('Error while waiting for transaction confirmation:', e);

    return '';
  }
}

export { linkToWallet, depositVault, sequencerWallet };
