import { config as dotenv } from "dotenv";
dotenv();

import { AccountUpdate, Bool, Field, Mina, PrivateKey, UInt8 } from "o1js";
import { Game2048ZKProgram } from "../lib/game2048ZKProgram.js";
import { Deposit2048 } from "../contracts/Deposit2048.js";

async function main() {
  console.log("Compiling Game2048ZKProgram...");
  await Game2048ZKProgram.compile();

  console.log("Compiling Deposit2048...");
  await Deposit2048.compile();

  const Network = Mina.Network(
    `https://api.minascan.io/node/${process.env.NETWORK || "devnet"}/v1/graphql`,
  );
  Mina.setActiveInstance(Network);

  const deployerPrivateKey = PrivateKey.fromBase58(process.env.PRIVATE_KEY!);
  const deployerAddress = deployerPrivateKey.toPublicKey();

  const { privateKey: tokenPrivateKey, publicKey: tokenAddress } =
    PrivateKey.randomKeypair();

  const token = new Deposit2048(tokenAddress);

  const fee = 100_000_000;

  console.log("Deployer Address:", deployerAddress.toJSON());
  console.log("Token Address:", tokenAddress.toJSON());

  // First, send 1 MINA (+1 fee) to the deployer address
  {
    const sendTx = await Mina.transaction(
      {
        sender: deployerAddress,
        fee: fee,
      },
      async () => {
        AccountUpdate.fundNewAccount(deployerAddress, 1);
        const update = AccountUpdate.createSigned(deployerAddress);
        update.send({
          to: tokenAddress,
          amount: 1000000000,
        });
      },
    );
    await sendTx.prove();
    const pendingTx = await sendTx.sign([deployerPrivateKey]).send();
    await pendingTx.wait();
    console.log("2 MINA sent to the deployer address");
  }

  // Create a new instance of the contract
  console.log("\n\n====== DEPLOYING ======\n\n");
  const deployTx = await Mina.transaction(
    {
      sender: tokenAddress,
      fee: fee,
    },
    async () => {
      await token.deploy();
      await token.setSeed(Field(1234567890));
    },
  );
  await deployTx.prove();
  const pendingTx = await deployTx.sign([tokenPrivateKey]).send();

  console.log("Deposit deployed at:", tokenAddress.toJSON());

  await pendingTx.wait();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
