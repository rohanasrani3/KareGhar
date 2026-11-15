import "server-only";
import { query } from "./db";

const windowMs = 15 * 60 * 1000;

// Shared persistent budgets also apply across application instances.
export async function takeAttempt(key: string) {
  const now = Date.now();
  await query("DELETE FROM login_limits WHERE started<$1", [now - windowMs]);
  const [limit] = await query<{ attempts: number }>(
    `INSERT INTO login_limits(username,attempts,started) VALUES ($1,1,$2)
     ON CONFLICT(username) DO UPDATE SET
     attempts=CASE WHEN login_limits.started<$3 THEN 1 ELSE login_limits.attempts+1 END,
     started=CASE WHEN login_limits.started<$3 THEN $2 ELSE login_limits.started END
     RETURNING attempts`,
    [key, now, now - windowMs],
  );
  return limit.attempts <= 12;
}

export async function clearAttempts(key: string) {
  await query("DELETE FROM login_limits WHERE username=$1", [key]);
}
