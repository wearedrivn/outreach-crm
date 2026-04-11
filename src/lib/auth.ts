import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const rawEmail = credentials?.email as string | undefined;
          const password = credentials?.password as string | undefined;

          if (!rawEmail || !password) return null;

          const email = rawEmail.trim().toLowerCase();

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            console.warn("[auth] no user for email:", email);
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            console.warn("[auth] bad password for email:", email);
            return null;
          }

          return { id: user.id, name: user.name, email: user.email };
        } catch (e) {
          const err = e as Error;
          console.error("[auth] authorize ERROR:", {
            name: err.name,
            message: err.message,
            stack: err.stack,
          });
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
