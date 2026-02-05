import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Retornado pelo `useSession`, `getSession` e recebido como prop no `SessionProvider`
   */
  interface Session {
    user: {
      role?: string;
      id?: string;
    } & DefaultSession["user"]
  }

  interface User {
    role?: string;
    id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
  }
}