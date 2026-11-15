import "server-only";
import type { Account } from "@/contract/schemas";
import type { Query } from "./db";

// Every operation that needs multiple accounts locks them in this order.
// Demand mutations acquire their demand lock before these account locks.
export async function lockAccounts(q: Query, ids: (string | null)[]) {
  for (const id of [...new Set(ids.filter((id): id is string => Boolean(id)))].sort())
    await q("UPDATE accounts SET revision=revision WHERE id=$1", [id]);
}

export async function currentSession(q: Query, user: Account) {
  return (await q(
    "UPDATE accounts SET revision=revision WHERE id=$1 AND deleted=0 AND revision=$2 AND id IN (SELECT id FROM account_state WHERE suspended=0 AND sample=0 AND session_version=$3) RETURNING id",
    [user.id, user.revision, user.session_version],
  )).length > 0;
}
