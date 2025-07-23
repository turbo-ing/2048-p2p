"use client";

// ### Very rare error caused by something in this file/ in the zk workers ###

// Error: The global context managed by o1js reached an inconsistent state. This could be caused by one of the following reasons:

// - You are missing an 'await' somewhere, which causes a new global context to be entered before we finished the last one.

// - You are importing two different instances of o1js, which leads to inconsistent tracking of the global context in one of those instances.
//   - This is a common problem in projects that use o1js as part of a UI!

// - You are running multiple async operations concurrently, which conflict in using the global context.
//   - Running async o1js operations (like proving) in parallel is not supported! Try running everything serially.

// Investigate the stack traces below for more hints about the problem.

// We wanted to leave the global context entered here:
//     at Yr (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2141:9673)
//     at Function.enter (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2141:9429)
//     at Object.$ [as initialize] (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2207:206)
//     at Object.initZKProof (webpack-internal:///(app-pages-browser)/./src/workers/zkWorker.ts:32:100)
//     at callback (webpack-internal:///(app-pages-browser)/./node_modules/comlink/dist/esm/comlink.mjs:116:48)

// But we actually would have left the global context entered here:
//     at Yr (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2141:9673)
//     at Function.enter (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2141:9429)
//     at Object.$ [as initialize] (webpack-internal:///(app-pages-browser)/./node_modules/o1js/dist/web/index.js:2207:206)
//     at Object.initZKProof (webpack-internal:///(app-pages-browser)/./src/workers/zkWorker.ts:32:100)
//     at callback (webpack-internal:///(app-pages-browser)/./node_modules/comlink/dist/esm/comlink.mjs:116:48)

// Our first recommendation is to check for a missing 'await' in the second stack trace.

// Source
// src/workers/zkWorker.ts (41:44) @ initialize

//   39 |     });
//   40 |
// > 41 |     const result = await Game2048ZKProgram.initialize(zkBoardWithSeed);
//      |                                            ^
//   42 |
//   43 |     proofCache = result.proof;
//   44 |

import * as Comlink from "comlink";
import {
  AccountUpdate,
  fetchAccount,
  Field,
  Mina,
  PrivateKey,
  Proof,
  PublicKey,
  Signature,
  UInt64,
} from "o1js";

import {
  Game2048ZKProgram,
  Game2048ZKProgramProof,
} from "@/lib/game2048ZKProgram";
import {
  Direction,
  GameBoard,
  GameBoardWithSeed,
  MAX_MOVES,
  printBoard,
} from "@/lib/game2048ZKLogic";
import { DirectionMap, MoveType } from "@/utils/constants";
import { Score2048 } from "@/app/mina/contracts/Score2048";
import { LeaderboardScore, DeployStatus } from "@/utils/types.ts";
import { Deposit2048 } from "../app/mina/contracts/Deposit2048.ts";

const SCORE_2048_ADDRESS =
  "B62qnpdkYEwSVEFBkifq6JeACAa839ikmvn86NTTB2FobSCNvBAo5st";

let proofCache: Game2048ZKProgramProof | null = null;
let sessionPrivateKey: PrivateKey | null = null;
let lastDepositPrivateKey: PrivateKey | null = null;
let score2048: Score2048 | null = null;

let zkProgramCompiling = false;
let contractsLoading = false;
let depositContractLoading = false;
let deployStatus = DeployStatus.Idle;

export const zkWorkerAPI = {
  async setActiveNetwork(network: string) {
    const Network = Mina.Network(network);
    console.log("Network instance configured", network);
    Mina.setActiveInstance(Network);
  },

  async getDeployStatus() {
    return deployStatus;
  },

  async initZKProof(
    boardNums: Number[],
    seedNum: bigint,
    sessionPrivateKeyBase58: string,
  ): Promise<[Proof<GameBoardWithSeed, void>, string]> {
    console.log("[Worker] Initializing ZK proof", boardNums, seedNum);
    const boardFields = boardNums.map((cell) => Field(cell.valueOf()));
    const zkBoard = new GameBoard(boardFields);
    const seed = Field(seedNum);
    sessionPrivateKey = PrivateKey.fromBase58(sessionPrivateKeyBase58);
    const sessionKey = sessionPrivateKey.toPublicKey();

    printBoard(zkBoard);

    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
      initialSeed: seed,
      sessionKey,
    });

    const result = await Game2048ZKProgram.initialize(zkBoardWithSeed);

    proofCache = result.proof;

    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },

  async generateZKProof(
    zkBoard: GameBoardWithSeed,
    moves: string[],
    signature: Signature,
  ): Promise<[Proof<GameBoardWithSeed, void>, string]> {
    console.log("[generateZKProof] peerId");
    if (!proofCache) {
      throw new Error("Proof cache is not initialized");
    }
    const directionsFields = moves.map((move) => {
      return Field.from(DirectionMap[move as MoveType] ?? 0);
    });

    if (directionsFields.length < MAX_MOVES) {
      // pad with 0
      for (let i = directionsFields.length; i < MAX_MOVES; i++) {
        directionsFields.push(Field.from(0));
      }
    }
    const directions = new Direction(directionsFields);

    const result = await Game2048ZKProgram.verifyTransition(
      zkBoard,
      proofCache,
      directions,
      signature,
    );

    // Update the proof cache
    proofCache = result.proof;
    console.log("[generateZKProof] Generated proof");

    return [result.proof, JSON.stringify(result.proof.toJSON())];
  },

  async generateProof(
    boardNums: Number[],
    seedNum: bigint,
    initialSeedNum: bigint,
    moves: string[],
  ): Promise<[Proof<GameBoardWithSeed, void>, string]> {
    if (!proofCache || !sessionPrivateKey) {
      throw new Error("Proof cache is not initialized");
    }

    while (
      deployStatus !== DeployStatus.Deployed &&
      deployStatus !== DeployStatus.Idle
    ) {
      console.log("ZK Processor waiting for deposit contract to be deployed");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const boardFields = boardNums.map((cell) => Field(cell.valueOf()));
    const zkBoard = new GameBoard(boardFields);
    const seed = Field(seedNum);
    const initialSeed = Field(initialSeedNum);
    const zkBoardWithSeed = new GameBoardWithSeed({
      board: zkBoard,
      seed,
      initialSeed,
      sessionKey: sessionPrivateKey.toPublicKey(),
    });

    const signature = Signature.create(sessionPrivateKey, [
      seed,
      ...proofCache.publicInput.board.cells,
      ...moves.map((move) => Field(DirectionMap[move as MoveType] ?? 0)),
    ]);

    return this.generateZKProof(zkBoardWithSeed, moves, signature);
  },

  async fetchAccount(publicKey58: string) {
    const publicKey = PublicKey.fromBase58(publicKey58);
    const account = await fetchAccount({ publicKey });
    return {
      error: account.error,
      balance: account.account?.balance.toBigInt() ?? 0n,
    };
  },

  async fetch2048Score(publicKey58: string) {
    // const publicKey = PublicKey.fromBase58(publicKey58);
    // const account = await fetchAccount({
    //   publicKey,
    //   tokenId: score2048!.deriveTokenId(),
    // });
    return {
      error: null,
      balance: 0n,
    };
  },

  async loadContracts() {
    if (contractsLoading) return;
    contractsLoading = true;

    console.log("Score 2048 address", SCORE_2048_ADDRESS);

    const result = await Game2048ZKProgram.compile();
    console.log("Compiled ZK program");

    const { Score2048 } = await import("../app/mina/contracts/Score2048.ts");
    await Score2048.compile();
    score2048 = new Score2048(PublicKey.fromBase58(SCORE_2048_ADDRESS));

    return result;
  },

  async loadDepositContract() {
    if (depositContractLoading) return;
    depositContractLoading = true;

    const { Deposit2048 } = await import(
      "../app/mina/contracts/Deposit2048.ts"
    );
    return await Deposit2048.compile();
  },

  async submitScore(publicKey58: string) {
    if (!sessionPrivateKey) {
      throw new Error("Session private key is not initialized");
    }

    if (!proofCache) {
      throw new Error("Proof cache is not initialized");
    }

    const publicKey = PublicKey.fromBase58(publicKey58);

    const signature = Signature.create(sessionPrivateKey!, [
      proofCache.publicInput.initialSeed,
      proofCache.publicInput.seed,
      ...proofCache.publicInput.board.cells,
      ...publicKey.toFields(),
    ]);

    const tx = await Mina.transaction(async () => {
      await score2048!.submit(proofCache!, publicKey, signature);
    });

    console.log("Generating proof for submitting score");

    await tx.prove();

    console.log("Proof generated... submitting score");

    return tx.toJSON();
  },

  async submitScoreMultiplayer(
    publicKey58: string,
    amount: bigint,
    depositAddresses: string[],
    players: string[],
    signatures: string[],
    proofs: any[],
  ) {
    console.log(
      "[zkWorker] Submitting score multiplayer",
      publicKey58,
      amount,
      depositAddresses,
      players,
      signatures,
      proofs,
    );

    if (!sessionPrivateKey) {
      throw new Error("Session private key is not initialized");
    }

    if (!proofCache) {
      throw new Error("Proof cache is not initialized");
    }

    if (
      depositAddresses.length != 2 ||
      players.length != 2 ||
      signatures.length != 2 ||
      proofs.length != 2
    ) {
      throw new Error("Invalid length");
    }

    const publicKey = PublicKey.fromBase58(publicKey58);

    const signature = Signature.create(sessionPrivateKey!, [
      proofCache.publicInput.initialSeed,
      proofCache.publicInput.seed,
      ...proofCache.publicInput.board.cells,
      ...publicKey.toFields(),
    ]);

    const deposit0 = new Deposit2048(PublicKey.fromBase58(depositAddresses[0]));
    const deposit1 = new Deposit2048(PublicKey.fromBase58(depositAddresses[1]));

    // // Perform tx in the background from the lastDepositPrivateKey wallet
    // const claimTx = await Mina.transaction(
    //   {
    //     sender: lastDepositPrivateKey!.toPublicKey(),
    //     fee: 100_000_000,
    //   },
    //   async () => {
    //     await deposit0.claim(
    //       UInt64.from(amount),
    //       PublicKey.fromBase58(players[0]),
    //       PublicKey.fromBase58(players[1]),
    //       Signature.fromBase58(signatures[0]),
    //       Signature.fromBase58(signatures[1]),
    //       await Game2048ZKProgramProof.fromJSON(proofs[0]),
    //       await Game2048ZKProgramProof.fromJSON(proofs[1]),
    //     );
    //     await deposit1.claim(
    //       UInt64.from(amount),
    //       PublicKey.fromBase58(players[0]),
    //       PublicKey.fromBase58(players[1]),
    //       Signature.fromBase58(signatures[0]),
    //       Signature.fromBase58(signatures[1]),
    //       await Game2048ZKProgramProof.fromJSON(proofs[0]),
    //       await Game2048ZKProgramProof.fromJSON(proofs[1]),
    //     );
    //   },
    // );

    // await claimTx.prove();

    // console.log("Proof generated... claiming rewards");

    // claimTx
    //   .sign([lastDepositPrivateKey!])
    //   .send()
    //   .then(() => {
    //     console.log("========= REWARD CLAIMED ==========");
    //   })
    //   .catch((error) => {
    //     console.error("Error claiming rewards", error);
    //   });

    const tx = await Mina.transaction(async () => {
      await score2048!.submit(proofCache!, publicKey, signature);
      await deposit0.claim(
        UInt64.from(amount),
        PublicKey.fromBase58(players[0]),
        PublicKey.fromBase58(players[1]),
        Signature.fromBase58(signatures[0]),
        Signature.fromBase58(signatures[1]),
        await Game2048ZKProgramProof.fromJSON(proofs[0]),
        await Game2048ZKProgramProof.fromJSON(proofs[1]),
      );
      await deposit1.claim(
        UInt64.from(amount),
        PublicKey.fromBase58(players[0]),
        PublicKey.fromBase58(players[1]),
        Signature.fromBase58(signatures[0]),
        Signature.fromBase58(signatures[1]),
        await Game2048ZKProgramProof.fromJSON(proofs[0]),
        await Game2048ZKProgramProof.fromJSON(proofs[1]),
      );
    });

    console.log("Generating proof for submitting score");

    await tx.prove();

    console.log("Proof generated... submitting score");

    return tx.toJSON();
  },

  async signDeposit(publicKey58: string, amount: bigint, players: string[]) {
    if (!sessionPrivateKey) {
      throw new Error("Session private key is not initialized");
    }

    if (!proofCache) {
      throw new Error("Proof cache is not initialized");
    }

    const publicKey = PublicKey.fromBase58(publicKey58);

    const playerFields = players.flatMap((player) =>
      PublicKey.fromBase58(player).toFields(),
    );

    const signature = Signature.create(sessionPrivateKey!, [
      proofCache.publicInput.initialSeed,
      proofCache.publicInput.seed,
      ...proofCache.publicInput.board.cells,
      ...publicKey.toFields(),
      ...Field(amount).toFields(),
      ...playerFields,
    ]);

    return signature.toBase58();
  },

  async fetchLeaderboard() {
    const Network = Mina.Network({
      mina: "https://api.minascan.io/node/devnet/v1/graphql",
      archive: "https://api.minascan.io/archive/devnet/v1/graphql",
    });
    Mina.setActiveInstance(Network);

    const score2048 = new Score2048(PublicKey.fromBase58(SCORE_2048_ADDRESS));

    // Fetch all events for a given address
    const fetchedEvents = await score2048.fetchEvents();

    const leaderboardMap: { [address: string]: LeaderboardScore } = {};

    for (const event of fetchedEvents) {
      const { to, score, maxTile } = event.event.data as unknown as {
        to: PublicKey;
        score: Field;
        maxTile: Field;
      };

      if (!leaderboardMap[to.toBase58()]) {
        leaderboardMap[to.toBase58()] = {
          address: to.toBase58(),
          totalScore: 0,
          maxScore: 0,
          maxTile: 0,
          playCount: 0,
          rank: 0,
        };
      }

      const oldLeaderboardScore = leaderboardMap[to.toBase58()];
      leaderboardMap[to.toBase58()] = {
        address: to.toBase58(),
        totalScore: oldLeaderboardScore.totalScore + Number(score.toBigInt()),
        maxScore: Math.max(
          oldLeaderboardScore.totalScore,
          Number(score.toBigInt()),
        ),
        maxTile: Math.max(
          oldLeaderboardScore.maxTile,
          Number(maxTile.toBigInt()),
        ),
        playCount: oldLeaderboardScore.playCount + 1,
        rank: 0,
      };
    }

    const scores = Object.values(leaderboardMap).sort((a, b) => {
      if (a.totalScore !== b.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (a.maxScore !== b.maxScore) {
        return b.maxScore - a.maxScore;
      }
      if (a.maxTile !== b.maxTile) {
        return b.maxTile - a.maxTile;
      }
      return b.playCount - a.playCount;
    });

    for (let i = 0; i < scores.length; i++) {
      scores[i].rank = i + 1;
    }

    return scores;
  },

  async deployDepositContract(seed: bigint, owner: string) {
    const depositPrivateKey = PrivateKey.random();
    const depositAddress = depositPrivateKey.toPublicKey();

    lastDepositPrivateKey = depositPrivateKey;

    console.log("DEPLOYING DEPOSIT CONTRACT WITH SEED", seed);

    deployStatus = DeployStatus.Compiling;

    setTimeout(async () => {
      console.log("Compiling deposit contract");
      await Deposit2048.compile();

      deployStatus = DeployStatus.Funding;
      console.log("Waiting for deposit contract to be funded");
      while (true) {
        try {
          const account = await fetchAccount({ publicKey: depositAddress });
          if (account.account && account.account.balance.toBigInt() > 0) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          console.log("Error fetching account", error);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      const fee = 100_000_000;
      const deposit = new Deposit2048(depositAddress);

      const ownerKey = PublicKey.fromBase58(owner);

      deployStatus = DeployStatus.Constructing;
      console.log("Constructing deploy transaction");
      const deployTx = await Mina.transaction(
        {
          sender: depositAddress,
          fee: fee,
        },
        async () => {
          await deposit.deploy();
          await deposit.setOwner(ownerKey);
          await deposit.setSeed(Field(seed));
        },
      );

      deployStatus = DeployStatus.Proving;
      console.log("Proving deploy transaction");
      await deployTx.prove();

      deployStatus = DeployStatus.Signing;
      console.log("Signing deploy transaction");
      const signedTx = await deployTx.sign([depositPrivateKey]);

      deployStatus = DeployStatus.Sending;
      console.log("Sending deploy transaction");
      const pendingTx = await signedTx.send();

      deployStatus = DeployStatus.Deploying;
      console.log("Deploying Deposit contract at", depositAddress.toBase58());
      await pendingTx.wait();

      deployStatus = DeployStatus.Deployed;
      console.log("Deposit contract deployed at", depositAddress.toBase58());
    }, 1);

    return depositAddress.toBase58();
  },
};

Comlink.expose(zkWorkerAPI);
