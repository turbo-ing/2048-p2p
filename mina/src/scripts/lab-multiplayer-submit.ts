import { config as dotenv } from "dotenv";
dotenv();

import {
  AccountUpdate,
  Bool,
  Mina,
  PrivateKey,
  PublicKey,
  Signature,
  UInt64,
  UInt8,
} from "o1js";
import { Deposit2048Test } from "../contracts/Deposit2048Test.js";
import {
  Game2048ZKProgram,
  Game2048ZKProgramProof,
} from "../lib/game2048ZKProgram.js";

import p1 from "./proofs/p1.json" with { type: "json" };
import p2 from "./proofs/p2.json" with { type: "json" };

const amount = 1000000000n;
const players = [
  "B62qrgEkAAFxUufRcS9DNuDTV3yksHQn5MpGzM8f5CLJRNpRs27DdkS",
  "B62qrgEkAAFxUufRcS9DNuDTV3yksHQn5MpGzM8f5CLJRNpRs27DdkS",
];
const signatures = [
  "7mX4Asn1LdXnvfGVTZeDcoqoyiAU6n7YSX9P6MK2F1wkKxfv7pXT4rcwNP48H1nNJqG2TT82qY1tpwRGebFU8bpwdifZ9deA",
  "7mXVfoaDkx6SB1hT6t1ScL21LKrHkt8yL9DsyxXmmSA5ni3AgyW36vYnPeKZJT4SVNf6NEbRgtpxeqMpzPfaxTiFNStvEmwj",
];
const proofs = [p1, p2];

async function main() {
  console.log("Compiling Game2048ZKProgram...");
  await Game2048ZKProgram.compile();

  console.log("Compiling Deposit2048Test...");
  await Deposit2048Test.compile();

  const Network = Mina.Network({
    mina: `https://api.minascan.io/node/${process.env.NETWORK || "devnet"}/v1/graphql`,
    archive: `https://api.minascan.io/archive/${process.env.NETWORK || "devnet"}/v1/graphql`,
  });
  Mina.setActiveInstance(Network);

  const walletPrivateKey = PrivateKey.fromBase58(process.env.PRIVATE_KEY!);
  const walletAddress = walletPrivateKey.toPublicKey();

  const fee = 100_000_000;

  console.log("Wallet Address:", walletAddress.toJSON());

  // Create a new instance of the contract
  console.log("\n\n====== DEPLOYING ======\n\n");

  const { privateKey: tokenPrivateKey, publicKey: tokenAddress } =
    PrivateKey.randomKeypair();

  const deposit = new Deposit2048Test(tokenAddress);

  const deployTx = await Mina.transaction(
    {
      sender: walletAddress,
      fee,
    },
    async () => {
      AccountUpdate.fundNewAccount(walletAddress, 1);
      await deposit.deploy();
    },
  );
  await deployTx.prove();
  const pendingDeployTx = await deployTx
    .sign([tokenPrivateKey, walletPrivateKey])
    .send();
  await pendingDeployTx.wait();

  // Create a execute claim transaction
  console.log("\n\n====== EXECUTING ======\n\n");

  const tx = await Mina.transaction(
    {
      sender: walletAddress,
      fee,
    },
    async () => {
      await deposit.claim(
        UInt64.from(amount),
        PublicKey.fromBase58(players[0]),
        PublicKey.fromBase58(players[1]),
        Signature.fromBase58(signatures[0]),
        Signature.fromBase58(signatures[1]),
        await Game2048ZKProgramProof.fromJSON(proofs[0] as any),
        await Game2048ZKProgramProof.fromJSON(proofs[1] as any),
      );
    },
  );

  await tx.prove();
  const pendingTx = await tx.sign([walletPrivateKey]).send();

  console.log("Transaction sent:", pendingTx.hash);

  await pendingTx.wait();

  // Get Claim events
  const events = await deposit.fetchEvents();
  const claimEvents = events.filter((e) => e.type === "Claim");

  console.log("\nClaim Events:");
  for (const event of claimEvents) {
    const { to, amount } = event.event.data as unknown as {
      to: PublicKey;
      amount: UInt64;
    };

    console.log(`Player ${to.toBase58()} claimed ${amount.toString()} tokens`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
