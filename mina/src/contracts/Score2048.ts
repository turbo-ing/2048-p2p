import {
  Field,
  SmartContract,
  state,
  State,
  method,
  TokenContract,
  AccountUpdateForest,
  Int64,
  Proof,
  Provable,
  PublicKey,
  AccountUpdate,
  UInt64,
  Signature,
  DeployArgs,
  CircuitString,
  Struct,
  Permissions,
} from "o1js";
import { Game2048ZKProgramProof } from "../lib/game2048ZKProgram.js";

export class Score2048 extends TokenContract {
  async deploy(args?: DeployArgs) {
    await super.deploy(args);
    this.account.tokenSymbol.set("2048-S");

    // make account non-upgradable forever
    this.account.permissions.set({
      ...Permissions.default(),
      setVerificationKey:
        Permissions.VerificationKey.impossibleDuringCurrentVersion(),
      setPermissions: Permissions.impossible(),
      access: Permissions.proofOrSignature(),
    });
  }

  async name() {
    return CircuitString.fromString("2048 Score");
  }

  async symbol() {
    return CircuitString.fromString("2048-S");
  }

  @method async approveBase(forest: AccountUpdateForest): Promise<void> {
    // Soulbound token, prevent any transfers from the user
    this.forEachUpdate(forest, (accountUpdate, usesToken) => {
      accountUpdate.balanceChange
        .equals(Int64.zero)
        .or(usesToken.not())
        .assertTrue();
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

  async getAccountUpdate(owner: PublicKey | AccountUpdate) {
    let update =
      owner instanceof PublicKey
        ? AccountUpdate.create(owner, this.deriveTokenId())
        : owner;
    await this.approveAccountUpdate(update);
    return update;
  }

  async balanceOf(owner: PublicKey | AccountUpdate) {
    let update = await this.getAccountUpdate(owner);
    return update.account.balance.getAndRequireEquals();
  }

  events = {
    SubmitScore: Struct({ to: PublicKey, score: UInt64 }),
  };

  @method async submit(
    proof: Game2048ZKProgramProof,
    to: PublicKey,
    signature: Signature,
  ) {
    proof.verify();
    signature.verify(proof.publicInput.sessionKey, [
      proof.publicInput.seed,
      ...proof.publicInput.board.cells,
      ...to.toFields(),
    ]);

    let score = Field(0);

    for (let i = 0; i < 16; i++) {
      score = score.add(this.singleCellScore(proof.publicInput.board.cells[i]));
    }

    let accountUpdate = await this.getAccountUpdate(to);

    let scoreUInt64 = new UInt64(score.value);
    let balanceUInt64 = accountUpdate.account.balance.getAndRequireEquals();

    scoreUInt64.assertGreaterThan(balanceUInt64);
    accountUpdate.balance.addInPlace(
      scoreUInt64.sub(balanceUInt64).mul(1_000_000_000),
    );
    accountUpdate.label = "Submit 2048 Score";
  }
}
