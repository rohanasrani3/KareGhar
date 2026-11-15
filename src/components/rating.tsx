export function Rating({ score, count, hi = false }: { score: number | null; count?: number; hi?: boolean }) {
  if (score === null || (count !== undefined && !count)) return <span className="rating-summary rating-empty">{hi ? "अभी कोई रेटिंग नहीं" : "Not rated yet"}</span>;
  const value = Number(score).toLocaleString(hi ? "hi-IN" : "en-IN", { minimumFractionDigits: count === undefined ? 0 : 1, maximumFractionDigits: 1 });
  return <span className="rating-summary">
    <span className="rating-star" aria-hidden="true">★</span>
    <span>{value}/5 <span className="rating-context">{count === undefined ? (hi ? "ग्राहक की रेटिंग" : "Customer rating") : `(${Number(count).toLocaleString(hi ? "hi-IN" : "en-IN")} ${hi ? "रेटिंग" : Number(count) === 1 ? "rating" : "ratings"})`}</span></span>
  </span>;
}
