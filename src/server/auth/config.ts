import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { db } from "@/server/db";
import { env } from "@/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "AGENT" | "VIEWER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "AGENT" | "VIEWER";
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    CredentialsProvider({
      id: "email",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("[Auth] Authorizing credentials:", {
            email: credentials?.email,
          });
          const { email, password } = credentials as {
            email: string;
            password: string;
          };

          if (!email || !password) {
            console.log("[Auth] Missing email or password");
            return null;
          }

          // Find user by email
          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user?.password) {
            console.log("[Auth] User not found or has no password");
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            console.log("[Auth] Invalid password");
            return null;
          }

          console.log("[Auth] Authorization successful for user:", user.id);
          return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error("Email authorization error:", error);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        try {
          const { phone, otp, name } = credentials as {
            phone: string;
            otp: string;
            name: string;
          };

          if (!phone || !otp) {
            return null;
          }

          // Verify OTP from database using Prisma
          const otpRecord = await db.otp.findFirst({
            where: {
              phone,
              otp,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          if (!otpRecord) {
            return null;
          }

          // Check if OTP is already used
          if (otpRecord.used) {
            return null;
          }

          // Check if OTP has expired
          if (new Date() > otpRecord.expiresAt) {
            return null;
          }

          // Mark OTP as used
          await db.otp.update({
            where: { id: otpRecord.id },
            data: { used: true },
          });

          // Find or create user
          let user = await db.user.findUnique({
            where: { phone },
          });

          if (!user) {
            // Create new user
            user = await db.user.create({
              data: {
                phone,
                name: name || "User",
                role: "AGENT", // Default role for new users
              },
            });
          } else {
            // Update last seen
            await db.user.update({
              where: { phone },
              data: {
                name: name || user.name,
              },
            });
          }

          return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error("OTP authorization error:", error);
          return null;
        }
      },
    }),
  ],
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  trustHost: true,
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        role: token.role as
          | "SUPER_ADMIN"
          | "ADMIN"
          | "MANAGER"
          | "AGENT"
          | "VIEWER",
      },
    }),
  },
} satisfies NextAuthConfig;
