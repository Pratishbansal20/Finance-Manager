import type { DefaultSession } from "next-auth";

// Add the user id to the session type (populated in the session callback).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
