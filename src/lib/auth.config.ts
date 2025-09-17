import { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        allowDangerousEmailAccountLinking: true, // 👈 Add this
    }),
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.username, credentials.username as string))
            .limit(1);

          if (!user[0] || !user[0].password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user[0].password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user[0].id.toString(),
            username: user[0].username,
            email: user[0].email,
            name: user[0].name,
            image: user[0].image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    // signUp: "/auth/signup",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.username = token.username as string;
      }
      return session;
    },
   async signIn({ user, account }) {
  if (account?.provider === "google") {
    try {
      // Check if user exists by email
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, user.email!))
        .limit(1);

      if (!existingUser[0]) {
        // If no user exists → create new one
        const username =
          user.email!.split("@")[0] +
          "_" +
          Math.random().toString(36).substring(2, 6);

        await db.insert(usersTable).values({
          username,
          email: user.email!,
          name: user.name,
          image: user.image,
          emailVerified: new Date(),
        });
      } else {
        // User already exists → allow sign in
        return true;
      }
      return true;
    } catch (error) {
      console.error("Error during Google sign in:", error);
      return false;
    }
  }
  return true;
}

  },
  session: {
    strategy: "jwt",
  },
};