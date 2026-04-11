import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

function withTimeout<T>(label: string, ms: number, promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms)
    ),
  ]);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  debug: process.env.NODE_ENV !== "production",
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[auth] authorize() START");
        try {
          const rawEmail = credentials?.email as string | undefined;
          const password = credentials?.password as string | undefined;

          if (!rawEmail || !password) {
            console.warn("[auth] missing credentials");
            return null;
          }

          const email = rawEmail.trim().toLowerCase();
          console.log("[auth] looking up user:", email);

          const user = await withTimeout(
            "findUnique",
            8000,
            prisma.user.findUnique({ where: { email } })
          );
          if (!user) {
            console.warn("[auth] no user for email:", email);
            return null;
          }
          console.log("[auth] user found:", user.id);

          const valid = await withTimeout(
            "bcrypt_compare",
            5000,
            bcrypt.compare(password, user.passwordHash)
          );
          if (!valid) {
            console.warn("[auth] bad password for:", email);
            return null;
          }

          console.log("[auth] authorize() SUCCESS:", user.id);
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
