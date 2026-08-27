import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isAuisEmail, normalizeAuisEmail } from "@/lib/validation";

const publicPaths = ["/", "/access-denied", "/privacy", "/terms", "/robots.txt"];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/access-denied",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;

      const email = normalizeAuisEmail(profile?.email ?? "");
      const verified = Boolean(profile?.email_verified);

      if (!verified || !isAuisEmail(email)) {
        return "/access-denied?reason=domain";
      }

      const [user] = await db
        .select({ id: users.id, active: users.active })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user?.active) {
        return "/access-denied?reason=unauthorized";
      }

      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          image: typeof profile?.picture === "string" ? profile.picture : null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return true;
    },
    async jwt({ token, account }) {
      if (account && token.email) {
        const email = normalizeAuisEmail(token.email);
        const [user] = await db
          .select({ id: users.id, role: users.role, active: users.active })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (user) {
          token.sub = user.id;
          token.role = user.role;
          token.active = user.active;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role ?? "STUDENT";
        session.user.active = token.active ?? false;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      if (
        publicPaths.includes(path) ||
        path.startsWith("/api/auth") ||
        path.startsWith("/_next")
      ) {
        return true;
      }
      return Boolean(session?.user?.id && session.user.active);
    },
  },
});
