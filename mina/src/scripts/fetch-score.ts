import { Score2048 } from "../contracts/Score2048.js";
import { fetchEvents, Mina, PublicKey } from "o1js";

const SCORE_2048_ADDRESS =
  "B62qkpcs7FKVtfcVFBnxgtSXJKACRRvjnHAtw54qyvbNwygaDVjwiAm";

async function main() {
  const Network = Mina.Network({
    mina: "https://api.minascan.io/node/devnet/v1/graphql",
    archive: "https://api.minascan.io/archive/devnet/v1/graphql",
  });
  Mina.setActiveInstance(Network);

  const score2048 = new Score2048(PublicKey.fromBase58(SCORE_2048_ADDRESS));

  // Fetch all events for a given address
  const fetchedEvents = await score2048.fetchEvents();

  console.log(fetchedEvents[0]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
