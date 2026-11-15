"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { paragraph } from "@/contract/schemas";
import { viewer } from "./auth";
import { transaction } from "./db";
import { currentSession, lockAccounts } from "./authorization";

export async function sendMessage(_: string, data: FormData) {
  const user = await viewer(), body = paragraph.safeParse(data.get("body"));
  if (!user) return "denied";
  if (!body.success) return "invalid";
  const id = String(data.get("id") ?? ""), artist = String(data.get("artist") ?? ""), now = Date.now();
  const result = await transaction(async (q) => {
    const locked = await q("UPDATE demands SET updated=updated WHERE id=$1 RETURNING id", [id]);
    if (!locked.length) return "denied";
    const [thread] = await q<{ customer: string; artist: string | null }>(`SELECT c.customer,c.artist FROM demand_state c
      WHERE c.id=$1 AND (c.customer=$2 OR $3=$2)
      AND (c.artist=$3 OR EXISTS(SELECT 1 FROM proposals p WHERE p.demand=c.id AND p.artist=$3))`, [id, user.id, artist]);
    if (!thread) return "denied";
    await lockAccounts(q, [user.id, thread.customer, thread.artist, artist]);
    if (!await currentSession(q, user)) return "denied";
    const rows = await q(`INSERT INTO messages(id,demand,sender,artist,body,created)
      SELECT $1,c.id,$2,$3,$4,$5 FROM demand_state c
      WHERE c.id=$6 AND c.sample=0 AND c.paused=0 AND (c.customer=$2 OR $3=$2)
      AND (c.artist=$3 OR EXISTS(SELECT 1 FROM proposals p WHERE p.demand=c.id AND p.artist=$3))
      AND EXISTS(SELECT 1 FROM account_state a WHERE a.id=$3 AND a.effective_role='artist' AND a.suspended=0 AND a.sample=0)
      AND EXISTS(SELECT 1 FROM account_state a WHERE a.id=$2 AND a.suspended=0 AND a.session_version=$7)
      RETURNING id`, [randomUUID(), user.id, artist, body.data, now, id, user.session_version]);
    if (!rows.length) return "denied";
    await q("UPDATE demands SET updated=$1 WHERE id=$2", [now, id]);
    return "saved";
  });
  revalidatePath("/", "layout");
  return result;
}
export async function markHistoryRead(_: string, data: FormData) {
  const user = await viewer();
  if (!user) return "denied";
  const requested = Number(data.get("seenAt"));
  if (!Number.isSafeInteger(requested) || requested < 0) return "invalid";
  const seenAt = Math.min(requested, Date.now()), id = String(data.get("id") ?? "");
  const rows = await transaction(async (q) => {
    if (!await currentSession(q, user)) return [];
    return q(`INSERT INTO history_reads(account,demand,last_seen)
    SELECT $1,c.id,$2 FROM demands c WHERE c.id=$3
    AND (c.customer=$1 OR c.artist=$1 OR EXISTS(SELECT 1 FROM proposals p WHERE p.demand=c.id AND p.artist=$1))
    AND EXISTS(SELECT 1 FROM account_state a WHERE a.id=$1 AND a.suspended=0 AND a.session_version=$4)
    ON CONFLICT(account,demand) DO UPDATE SET last_seen=CASE WHEN history_reads.last_seen>excluded.last_seen THEN history_reads.last_seen ELSE excluded.last_seen END
    RETURNING account`, [user.id, seenAt, id, user.session_version]);
  });
  if (!rows.length) return "denied";
  revalidatePath("/", "layout");
  return "saved";
}
