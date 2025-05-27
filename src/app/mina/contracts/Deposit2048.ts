import { Game2048ZKProgramProof } from "@/lib/game2048ZKProgram";
import {
  Bool,
  method,
  Permissions,
  Provable,
  PublicKey,
  Signature,
  SmartContract,
  State,
  state,
  UInt64,
  Field,
  declareMethods,
} from "o1js";

const PublicKey2 = Provable.Array(PublicKey, 2);
const PublicKey3 = Provable.Array(PublicKey, 3);
const PublicKey4 = Provable.Array(PublicKey, 4);

const Signature2 = Provable.Array(Signature, 2);
const Signature3 = Provable.Array(Signature, 3);
const Signature4 = Provable.Array(Signature, 4);

const Proof2 = Provable.Array(Game2048ZKProgramProof, 2);
const Proof3 = Provable.Array(Game2048ZKProgramProof, 3);
const Proof4 = Provable.Array(Game2048ZKProgramProof, 4);

export class Deposit2048 extends SmartContract {
  @state(PublicKey) owner = State<PublicKey>();
  @state(Field) seed = State<Field>(Field(0));

  async deploy() {
    super.deploy();

    // Set owner to deployer
    this.owner.set(this.sender.getAndRequireSignature());

    // make account non-upgradable forever
    this.account.permissions.set({
      ...Permissions.default(),
      setVerificationKey:
        Permissions.VerificationKey.impossibleDuringCurrentVersion(),
      setPermissions: Permissions.impossible(),
      access: Permissions.proofOrSignature(),
    });
  }

  singleCellScore(cell: Field): Field {
    const log2minus1 = Provable.if(
      cell.equals(Field(2)),
      Field(0),
      Provable.if(
        cell.equals(Field(4)),
        Field(1),
        Provable.if(
          cell.equals(Field(8)),
          Field(2),
          Provable.if(
            cell.equals(Field(16)),
            Field(3),
            Provable.if(
              cell.equals(Field(32)),
              Field(4),
              Provable.if(
                cell.equals(Field(64)),
                Field(5),
                Provable.if(
                  cell.equals(Field(128)),
                  Field(6),
                  Provable.if(
                    cell.equals(Field(256)),
                    Field(7),
                    Provable.if(
                      cell.equals(Field(512)),
                      Field(8),
                      Provable.if(
                        cell.equals(Field(1024)),
                        Field(9),
                        Provable.if(
                          cell.equals(Field(2048)),
                          Field(10),
                          Provable.if(
                            cell.equals(Field(4096)),
                            Field(11),
                            Provable.if(
                              cell.equals(Field(8192)),
                              Field(12),
                              Provable.if(
                                cell.equals(Field(16384)),
                                Field(13),
                                Provable.if(
                                  cell.equals(Field(32768)),
                                  Field(14),
                                  Field(15),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    return log2minus1.mul(cell);
  }

  score(cells: Field[]): Field {
    let score = Field(0);
    for (let i = 0; i < 16; i++) {
      score = score.add(this.singleCellScore(cells[i]));
    }
    return score;
  }

  async claimInternal(
    numPlayers: number,
    amount: UInt64,
    players: PublicKey[],
    signatures: Signature[],
    proofs: Game2048ZKProgramProof[],
  ) {
    for (let i = 0; i < numPlayers; i++) {
      proofs[i].verify();
    }

    let seed = this.seed.getAndRequireEquals();

    // Check same seed
    for (let i = 0; i < numPlayers; i++) {
      seed.assertEquals(proofs[i].publicInput.seed);
    }

    const playerFields = players.flatMap((player) => player.toFields());

    // Check signatures
    for (let i = 0; i < numPlayers; i++) {
      signatures[i].verify(proofs[i].publicInput.sessionKey, [
        proofs[i].publicInput.seed,
        ...proofs[i].publicInput.board.cells,
        ...players[i].toFields(),
        ...amount.toFields(),
        ...playerFields,
      ]);
    }

    // Verify if owner and sender is one of the players
    const owner = this.owner.get();
    let hasOwner = Bool(false);
    let maxScore = Field(0);
    let maxCount = UInt64.zero;

    let scores: Field[] = [];

    for (let i = 0; i < numPlayers; i++) {
      hasOwner = hasOwner.or(players[i].equals(owner));

      let score = this.score(proofs[i].publicInput.board.cells);
      maxScore = Provable.if(score.greaterThan(maxScore), score, maxScore);
      maxCount = Provable.if(
        score.equals(maxScore),
        maxCount.add(UInt64.one),
        UInt64.one,
      );

      scores.push(score);
    }

    hasOwner.assertTrue();

    // Players are rewarded if they achieve max score
    const rewardAmount = amount.div(maxCount);
    for (let i = 0; i < numPlayers; i++) {
      // Transfer reward to the player
      const individualReward = Provable.if(
        scores[i].equals(maxScore),
        rewardAmount,
        UInt64.zero,
      );
      this.send({ to: players[i], amount: individualReward });
    }

    // Reset seed once the claim is done
    this.seed.set(Field(0));
  }

  async claim2(
    amount: UInt64,
    players: PublicKey[],
    signatures: Signature[],
    proofs: Game2048ZKProgramProof[],
  ) {
    this.claimInternal(2, amount, players, signatures, proofs);
  }

  async claim3(
    amount: UInt64,
    players: PublicKey[],
    signatures: Signature[],
    proofs: Game2048ZKProgramProof[],
  ) {
    this.claimInternal(3, amount, players, signatures, proofs);
  }

  async claim4(
    amount: UInt64,
    players: PublicKey[],
    signatures: Signature[],
    proofs: Game2048ZKProgramProof[],
  ) {
    this.claimInternal(4, amount, players, signatures, proofs);
  }

  async setSeed(seed: Field) {
    let oldSeed = this.seed.getAndRequireEquals();
    oldSeed.assertEquals(0);
    this.seed.set(seed);
  }
}

// @ts-ignore
declareMethods(Deposit2048, {
  // @ts-ignore
  claim2: [UInt64, PublicKey2, Signature2, Proof2],
  // @ts-ignore
  claim3: [UInt64, PublicKey3, Signature3, Proof3],
  // @ts-ignore
  claim4: [UInt64, PublicKey4, Signature4, Proof4],
  // @ts-ignore
  setSeed: [Field],
});
