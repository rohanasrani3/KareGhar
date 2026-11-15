import { viewer } from "@/server/auth";
import { query } from "@/server/db";
import { mediaResponse } from "@/server/media";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|mp3|mp4|wav)$/.test(key))
    return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const user = await viewer();
  const readable = await query(
    `SELECT id FROM account_state WHERE photo=$1 AND suspended=0
     UNION ALL SELECT w.id FROM works w JOIN account_state a ON a.id=w.artist WHERE w.url='/api/media/' || $1 AND a.suspended=0
     UNION ALL SELECT id FROM demand_state WHERE output=$1 AND ((paused=0 AND status='done' AND published=1) OR customer=$2 OR artist=$2)
     UNION ALL SELECT c.id FROM demand_state c WHERE c.reference=$1 AND
       ((c.paused=0 AND c.status IN ('finding','done')) OR c.customer=$2 OR c.artist=$2 OR EXISTS(SELECT 1 FROM proposals p WHERE p.demand=c.id AND p.artist=$2))
     UNION ALL SELECT e.id FROM demand_events e JOIN demands c ON c.id=e.demand WHERE e.output=$1 AND $2<>'' AND (c.customer=$2 OR e.artist=$2)`,
    [key, user?.id ?? ""],
  );
  return readable.length
    ? mediaResponse(key, request)
    : new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
}
