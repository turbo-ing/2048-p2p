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
} from "o1js";

export class Deposit2048 extends SmartContract {
  @state(PublicKey) owner = State<PublicKey>();
  @state(Field) seed = State<Field>(Field(0));

  async deploy() {
    super.deploy();

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
      seed.assertEquals(proofs[i].publicInput.initialSeed);
    }

    const playerFields = players.flatMap((player) => player.toFields());

    // Check signatures
    for (let i = 0; i < numPlayers; i++) {
      signatures[i].verify(proofs[i].publicInput.sessionKey, [
        proofs[i].publicInput.initialSeed,
        proofs[i].publicInput.seed,
        ...proofs[i].publicInput.board.cells,
        ...players[i].toFields(),
        ...amount.toFields(),
        ...playerFields,
      ]);
    }

    // Verify if owner and sender is one of the players
    const owner = this.owner.getAndRequireEquals();
    let hasOwner = Bool(false);
    let maxScore = Field(0);
    let maxCount = UInt64.zero;

    let scores: Field[] = [];

    for (let i = 0; i < numPlayers; i++) {
      hasOwner = hasOwner.or(players[i].equals(owner));

      let score = this.score(proofs[i].publicInput.board.cells);
      maxScore = Provable.if(score.greaterThan(maxScore), score, maxScore);

      scores.push(score);
    }

    for (let i = 0; i < numPlayers; i++) {
      let score = scores[i];
      maxCount = Provable.if(
        score.equals(maxScore),
        maxCount.add(UInt64.one),
        maxCount,
      );
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

  @method
  async claim(
    amount: UInt64,
    player1: PublicKey,
    player2: PublicKey,
    signature1: Signature,
    signature2: Signature,
    proof1: Game2048ZKProgramProof,
    proof2: Game2048ZKProgramProof,
  ) {
    this.claimInternal(
      2,
      amount,
      [player1, player2],
      [signature1, signature2],
      [proof1, proof2],
    );
  }

  @method
  async setSeed(seed: Field) {
    let oldSeed = this.seed.getAndRequireEquals();
    oldSeed.assertEquals(0);
    this.seed.set(seed);
  }

  @method
  async setOwner(owner: PublicKey) {
    let oldOwner = this.owner.getAndRequireEquals();
    oldOwner.isEmpty().assertTrue();
    this.owner.set(owner);
  }
}
