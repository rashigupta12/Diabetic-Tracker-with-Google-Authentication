import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { CustomDrizzleAdapter } from "./customDrizzleAdapter";



export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: CustomDrizzleAdapter(),
});

// Type declarations for enhanced session
declare module "next-auth" {
  interface User {
    username?: string;
  }
  
  interface Session {
    user: {
      id: string;
      username?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}