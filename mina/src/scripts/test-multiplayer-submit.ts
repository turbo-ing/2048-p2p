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
import { Deposit2048 } from "../contracts/Deposit2048.js";
import {
  Game2048ZKProgram,
  Game2048ZKProgramProof,
} from "../lib/game2048ZKProgram.js";

import p1 from "./proofs/p1.json" with { type: "json" };
import p2 from "./proofs/p2.json" with { type: "json" };

const amount = 1000000000n;
const depositAddresses = [
  "B62qj6dJrjD66P86QQXDw9hYQ65GLwMbbHiywCWMgswnQZK2uJZJVjR",
  "B62qnDf5gz8Bb8ZkQFzj8igxh6spYxjKugzfmmHr9zGyyHoT2pnXEQt",
];
const players = [
  "B62qrgEkAAFxUufRcS9DNuDTV3yksHQn5MpGzM8f5CLJRNpRs27DdkS",
  "B62qrgEkAAFxUufRcS9DNuDTV3yksHQn5MpGzM8f5CLJRNpRs27DdkS",
];
const signatures = [
  "7mX6YvHMKfnr4M8RydoYsGjQtspomZdgdRtgqj2E2hduJJDhNzKUJ9K7WkNdWeeW7S7cA7Z3r2RsnxJBP8cMBbDELjkQsRpt",
  "7mXHvPtwCxo9jog1XYyK9jCwP8h8X5Wtx1knrEXTSKPisEHqPYLmPma6XrJ2BSn8kmqRYCwWXPHd6Wh8xj9Wx3YqxdKcea1H",
];
const proofs = [p1, p2];

async function main() {
  console.log("Compiling Game2048ZKProgram...");
  await Game2048ZKProgram.compile();

  console.log("Compiling Deposit2048...");
  await Deposit2048.compile();

  const Network = Mina.Network(
    `https://api.minascan.io/node/${process.env.NETWORK || "devnet"}/v1/graphql`,
  );
  Mina.setActiveInstance(Network);

  const walletPrivateKey = PrivateKey.fromBase58(process.env.PRIVATE_KEY!);
  const walletAddress = walletPrivateKey.toPublicKey();

  const fee = 100_000_000;

  console.log("Wallet Address:", walletAddress.toJSON());

  // Create a new instance of the contract
  console.log("\n\n====== EXECUTING ======\n\n");

  const deposit0 = new Deposit2048(PublicKey.fromBase58(depositAddresses[0]));
  const deposit1 = new Deposit2048(PublicKey.fromBase58(depositAddresses[1]));

  const tx = await Mina.transaction(
    {
      sender: walletAddress,
      fee,
    },
    async () => {
      await deposit0.claim(
        UInt64.from(amount),
        PublicKey.fromBase58(players[0]),
        PublicKey.fromBase58(players[1]),
        Signature.fromBase58(signatures[0]),
        Signature.fromBase58(signatures[1]),
        await Game2048ZKProgramProof.fromJSON(proofs[0] as any),
        await Game2048ZKProgramProof.fromJSON(proofs[1] as any),
      );
      await deposit1.claim(
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
