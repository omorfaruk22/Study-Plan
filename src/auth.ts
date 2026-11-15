import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ownerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !ownerEmail) return false;
      const email = (user.email || "").trim().toLowerCase();
      const googleProfile = profile as { email_verified?: boolean } | undefined;
      return email === ownerEmail && googleProfile?.email_verified === true;
    },
    async session({ session }) {
      return session;
    }
  }
});
