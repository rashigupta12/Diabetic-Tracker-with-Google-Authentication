/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/customDrizzleAdapter.ts
import type { Adapter, AdapterAccount, AdapterSession } from "next-auth/adapters";
import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  usersTable,
  accountsTable,
  sessionsTable,
  verificationTokensTable,
} from "@/db/schema";

/**
 * Map DB user -> NextAuth user (NextAuth expects id to be string)
 */
function mapUser(user: any) {
  if (!user) return null;
  return {
    id: String(user.id),
    name: user.name ?? null,
    email: user.email ?? null,
    emailVerified: user.emailVerified ?? null,
    image: user.image ?? null,
    // include any custom props you want to expose
    username: user.username ?? null,
  };
}

export function CustomDrizzleAdapter(): Adapter {
  return {
    // ----------------- USERS -----------------
    async createUser(user) {
      // email is required in your schema; use non-null assertion if you're sure
      const [created] = await db
        .insert(usersTable)
        .values({
          email: user.email!,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          username: (user as any).username ?? undefined,
          // password might be undefined for OAuth users
          password: (user as any).password ?? undefined,
          // createdAt/updatedAt may have default in schema
        } as any) // cast to any to avoid Drizzle strict literal mismatch
        .returning();

      return mapUser(created)!;
    },

    async getUser(id) {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, Number(id)));
      return mapUser(user);
    },

    async getUserByEmail(email) {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
      return mapUser(user);
    },

    async getUserByAccount(account) {
      // find account, then fetch user
      const [acc] = await db
        .select()
        .from(accountsTable)
        .where(
          eq(accountsTable.provider, account.provider) &&
            eq(accountsTable.providerAccountId, account.providerAccountId)
        );

      if (!acc) return null;

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, acc.userId));

      return mapUser(user);
    },

    async updateUser(user) {
      if (!user.id) throw new Error("User id required");

      const [updated] = await db
        .update(usersTable)
        .set({
          // only set fields if present — use undefined to skip others
          name: user.name ?? undefined,
          email: user.email ?? undefined, // if you make email optional in schema; otherwise ensure user.email exists
          image: user.image ?? undefined,
          username: (user as any).username ?? undefined,
          password: (user as any).password ?? undefined,
          // updatedAt: leave to DB default or set explicitly if needed
        } as any) // cast to any to satisfy Drizzle's strict typing
        .where(eq(usersTable.id, Number(user.id)))
        .returning();

      return mapUser(updated)!;
    },

    async deleteUser(id) {
      await db.delete(usersTable).where(eq(usersTable.id, Number(id)));
    },

    // ----------------- ACCOUNTS -----------------
    async linkAccount(account: AdapterAccount) {
      // We cast to `any` because Drizzle's generated insert signature may expect different literal keys
      await db.insert(accountsTable).values({
        userId: Number(account.userId),
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refreshToken: account.refresh_token ?? undefined,
        accessToken: account.access_token ?? undefined,
        expiresAt: account.expires_at ?? undefined,
        tokenType: account.token_type ?? undefined,
        scope: account.scope ?? undefined,
        idToken: account.id_token ?? undefined,
        sessionState: account.session_state ?? undefined,
      } as any);
      return account;
    },

    async unlinkAccount(account) {
      await db
        .delete(accountsTable)
        .where(
          eq(accountsTable.provider, account.provider) &&
            eq(accountsTable.providerAccountId, account.providerAccountId)
        );
    },

    // ----------------- SESSIONS -----------------
    async createSession(session: AdapterSession) {
      const [created] = await db
        .insert(sessionsTable)
        .values({
          sessionToken: session.sessionToken,
          userId: Number(session.userId),
          expires: session.expires,
        } as any)
        .returning();

      return {
        sessionToken: created.sessionToken,
        userId: String(created.userId),
        expires: created.expires,
      };
    },

    async getSessionAndUser(sessionToken) {
      const [session] = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.sessionToken, sessionToken));

      if (!session) return null;

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, session.userId));

      return {
        session: {
          sessionToken: session.sessionToken,
          userId: String(session.userId),
          expires: session.expires,
        },
        user: mapUser(user)!,
      };
    },

    async updateSession(session) {
      const [updated] = await db
        .update(sessionsTable)
        .set({
          expires: session.expires,
        } as any)
        .where(eq(sessionsTable.sessionToken, session.sessionToken))
        .returning();

      if (!updated) return null;

      return {
        sessionToken: updated.sessionToken,
        userId: String(updated.userId),
        expires: updated.expires,
      };
    },

    async deleteSession(sessionToken) {
      await db.delete(sessionsTable).where(eq(sessionsTable.sessionToken, sessionToken));
    },

    // -------------- VERIFICATION TOKENS --------------
    async createVerificationToken(token) {
      const [created] = await db
        .insert(verificationTokensTable)
        .values({
          identifier: token.identifier,
          token: token.token,
          expires: token.expires,
        } as any)
        .returning();

      return {
        identifier: created.identifier,
        token: created.token,
        expires: created.expires,
      };
    },

    async useVerificationToken(token) {
      const [existing] = await db
        .select()
        .from(verificationTokensTable)
        .where(eq(verificationTokensTable.identifier, token.identifier) && eq(verificationTokensTable.token, token.token));

      if (!existing) return null;

      await db
        .delete(verificationTokensTable)
        .where(eq(verificationTokensTable.identifier, token.identifier) && eq(verificationTokensTable.token, token.token));

      return {
        identifier: existing.identifier,
        token: existing.token,
        expires: existing.expires,
      };
    },
  };
}
