import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      boutiqueId: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    boutiqueId: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    boutiqueId: number;
  }
}
