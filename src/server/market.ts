import "server-only";
import { query } from "./db";
import type { Account, Commission, Form, Proposal, Work } from "@/contract/schemas";
type Filters = { category?: string; form?: string; status?: string };
export const forms = () => query<Form>("SELECT * FROM forms ORDER BY category,name");

/** Reused only by server-owned queries. The output itself always needs an access projection. */
export const commissionColumns = (viewerParameter: "$1" | "$5") => `c.paused,c.id,c.title,c.brief,c.form,
 CASE WHEN c.customer=${viewerParameter} OR c.artist=${viewerParameter} THEN c.fee ELSE c.original_fee END AS fee,
 c.original_fee,c.status,c.customer,c.artist,c.sample,c.published,
 c.output_type,c.reference,c.deadline,c.created,c.updated,c.selected_at,c.submitted_at,
 a.name AS customer_name,a.username AS customer_username,a.contact AS customer_contact,
 b.name AS artist_name,b.username AS artist_username,b.contact AS artist_contact`;

/** Individual scores follow the finished file's visibility. Use a server-owned SQL parameter. */
export const commissionRating = (viewerParameter: "$1" | "$5") => `CASE WHEN c.status='done' AND c.output<>''
 AND ((c.paused=0 AND c.published=1) OR c.customer=${viewerParameter} OR c.artist=${viewerParameter})
 THEN (SELECT r.score FROM demand_ratings r WHERE r.demand=c.id AND r.artist=c.artist AND r.customer=c.customer) ELSE NULL END AS rating`;

// A private completion contributes to the overall score without exposing its file or individual rating.
const artistRatingColumns = `(SELECT AVG(CAST(r.score AS REAL)) FROM demand_ratings r JOIN demands rc ON rc.id=r.demand
 WHERE r.artist=a.id AND rc.artist=r.artist AND rc.customer=r.customer AND rc.status='done' AND rc.output<>'') AS rating_average,
 (SELECT COUNT(*) FROM demand_ratings r JOIN demands rc ON rc.id=r.demand
 WHERE r.artist=a.id AND rc.artist=r.artist AND rc.customer=r.customer AND rc.status='done' AND rc.output<>'') AS rating_count`;

export interface ArtistRating { rating_average: number | null; rating_count: number }
export async function artistRating(artist: string): Promise<ArtistRating> {
  const [result] = await query<ArtistRating>(`SELECT ${artistRatingColumns} FROM account_state a WHERE a.id=$1 AND a.effective_role='artist' AND a.suspended=0`, [artist]);
  return result ?? { rating_average: null, rating_count: 0 };
}

export function commissions(filters: Filters = {}, id = "", viewerId = "") {
  return query<Commission>(
    `SELECT ${commissionColumns("$5")},${commissionRating("$5")},
    CASE WHEN (c.paused=0 AND c.status='done' AND c.published=1) OR c.customer=$5 OR c.artist=$5 THEN c.output ELSE '' END AS output
    FROM demand_state c JOIN accounts a ON a.id=c.customer LEFT JOIN accounts b ON b.id=c.artist JOIN forms f ON f.id=c.form
    WHERE (c.paused=0 OR ($4<>'' AND (c.customer=$5 OR c.artist=$5)))
      AND c.status IN ('finding','done')
      AND ($4<>'' OR $5='' OR (c.customer<>$5 AND COALESCE(c.artist,'')<>$5))
      AND ($1='' OR f.category=$1) AND ($2='' OR c.form=$2) AND ($3='' OR c.status=$3) AND ($4='' OR c.id=$4)
    ORDER BY c.created DESC,c.id`,
    [filters.category ?? "", filters.form ?? "", filters.status ?? "", id, viewerId],
  );
}

export type Artist = Pick<Account, "id" | "username" | "name" | "photo" | "company" | "sample" | "contact" | "bio"> & ArtistRating & {
  completed: number; cover_url: string | null; form_ids: string | null;
};
export function artists(filters: Filters = {}) {
  return query<Artist>(
    `SELECT a.id,a.username,a.name,a.company,a.photo,a.sample,a.contact,a.bio,${artistRatingColumns},
    (SELECT w.url FROM works w JOIN forms wf ON wf.id=w.form WHERE w.artist=a.id AND ($1='' OR wf.category=$1) AND ($2='' OR w.form=$2) AND (lower(w.url) LIKE '%.png' OR lower(w.url) LIKE '%.jpg' OR lower(w.url) LIKE '%.jpeg' OR lower(w.url) LIKE '%.webp' OR w.url LIKE '/seed/%.svg') ORDER BY w.title,w.id LIMIT 1) AS cover_url,
    (SELECT string_agg(f.id,',') FROM forms f WHERE EXISTS(SELECT 1 FROM works w WHERE w.artist=a.id AND w.form=f.id)
     OR EXISTS(SELECT 1 FROM demands c WHERE c.artist=a.id AND c.form=f.id AND c.status='done' AND c.output<>'')) AS form_ids,
    (SELECT CAST(COUNT(*) AS INTEGER) FROM demands c JOIN forms f ON f.id=c.form WHERE c.artist=a.id AND c.status='done' AND c.output<>''
     AND ($1='' OR f.category=$1) AND ($2='' OR f.id=$2)) AS completed
    FROM account_state a WHERE a.effective_role='artist' AND a.suspended=0 AND (($1='' AND $2='') OR EXISTS(
     SELECT 1 FROM forms f WHERE ($1='' OR f.category=$1) AND ($2='' OR f.id=$2) AND
     (EXISTS(SELECT 1 FROM works w WHERE w.form=f.id AND w.artist=a.id) OR EXISTS(SELECT 1 FROM demands c WHERE c.form=f.id AND c.artist=a.id AND c.status='done' AND c.output<>''))))
    ORDER BY completed DESC,a.name,a.id`,
    [filters.category ?? "", filters.form ?? ""],
  );
}
export const works = (artist: string) => query<Work>(
  "SELECT w.id,w.title,w.url,w.form FROM works w JOIN account_state a ON a.id=w.artist WHERE w.artist=$1 AND a.suspended=0 ORDER BY w.title,w.id", [artist],
);
export const publicProfile = async (username: string) => (
  await query<Pick<Account, "id" | "role" | "name" | "username" | "sample" | "links" | "company" | "photo" | "bio" | "contact">>(
    "SELECT id,role,name,username,sample,links,company,photo,bio,contact FROM account_state WHERE username=$1 AND effective_role<>'admin' AND suspended=0", [username],
  )
)[0];
export const proposals = (id: string, user: string) => query<Proposal>(
  `SELECT p.id,p.artist,p.message,p.quote,p.initial_quote,p.pricing,p.created,p.updated,p.status,a.name,a.username,a.contact,a.suspended AS unavailable
   FROM proposals p JOIN account_state a ON a.id=p.artist JOIN demands c ON c.id=p.demand
   WHERE c.id=$1 AND (c.customer=$2 OR p.artist=$2) ORDER BY p.created,p.id`, [id, user],
);
export const publishedWorks = (artist: string) => query<{ id: string; title: string; output: string; form: string; rating: number | null }>(
  `SELECT c.id,c.title,c.output,c.form,r.score AS rating FROM demand_state c LEFT JOIN demand_ratings r ON r.demand=c.id AND r.artist=c.artist AND r.customer=c.customer
   WHERE c.paused=0 AND c.artist=$1 AND c.status='done' AND c.published=1 AND c.output<>'' ORDER BY c.submitted_at DESC,c.created DESC`, [artist],
);
