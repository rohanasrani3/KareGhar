import "server-only";
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { query } from "./db";
import type { Account } from "@/contract/schemas";
import { takeAttempt, clearAttempts } from "./attempts";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "KareGhar",
      credentials: {
        username: { type: "text" },
        password: { type: "password" },
      },
      async authorize(input) {
        const username = input?.username?.trim();
        if (
          !username ||
          !/^[A-Za-z0-9_]{3,40}$/.test(username) ||
          !input?.password ||
          input.password.length > 128
        )
          return null;
        const attemptKey = "login:" + username;
        if (!(await takeAttempt(attemptKey))) return null;
        const [user] = await query<Account & { password_hash: string }>(
          "SELECT * FROM account_state WHERE username=$1 AND sample=0 AND suspended=0",
          [username],
        );
        if (!user?.password_hash || !(await verify(user.password_hash, input.password).catch(() => false)))
          return null;
        await clearAttempts(attemptKey);
        return { id: user.id, name: user.name, revision: user.session_version };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user)
        token.revision = (user as typeof user & { revision: number }).revision;
      return token;
    },
    async session({ session, token }) {
      if (token.sub)
        Object.assign(session, {
          accountId: token.sub,
          revision: token.revision,
        });
      return session;
    },
  },
};
export async function viewer(): Promise<Account | null> {
  const session = (await getServerSession(authOptions)) as {
    accountId?: string;
    revision?: number;
  } | null;
  if (!session?.accountId || typeof session.revision !== "number") return null;
  return (
    (
      await query<Account>(
        "SELECT id,name,email,username,effective_role AS role,company,links,photo,bio,contact,deleted,revision,sample,session_version FROM account_state WHERE id=$1 AND session_version=$2 AND suspended=0",
        [session.accountId, session.revision],
      )
    )[0] ?? null
  );
}
