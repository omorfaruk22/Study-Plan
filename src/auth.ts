import NextAuth from "next-auth";
import { createHash, timingSafeEqual } from "node:crypto";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const ownerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
const ownerPassword = process.env.OWNER_PASSWORD || "";

function matchesOwnerPassword(candidate: string, expected: string) {
  const candidateDigest = createHash("sha256").update(candidate).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Admin email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!ownerEmail || !ownerPassword || email !== ownerEmail || !password || !matchesOwnerPassword(password, ownerPassword)) return null;
        return { id: ownerEmail, email: ownerEmail, name: "Admin" };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = (user.email || "").trim().toLowerCase();
      if (account?.provider === "credentials") return Boolean(ownerEmail && ownerPassword && email === ownerEmail);
      if (account?.provider !== "google" || !ownerEmail) return false;
      const googleProfile = profile as { email_verified?: boolean } | undefined;
      return email === ownerEmail && googleProfile?.email_verified === true;
    },
    async session({ session }) {
      return session;
    }
  }
});
