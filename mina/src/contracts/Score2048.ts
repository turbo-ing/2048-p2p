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

export class Score2048 extends SmartContract {
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

  events = {
    SubmitScore: Struct({ to: PublicKey, score: Field }),
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

    this.emitEvent("SubmitScore", { to, score });
  }
}
