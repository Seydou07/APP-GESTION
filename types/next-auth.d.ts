import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      boutiqueId: number;
      boutiqueName: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    boutiqueId: number;
    boutiqueName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    boutiqueId: number;
    boutiqueName: string;
  }
}
