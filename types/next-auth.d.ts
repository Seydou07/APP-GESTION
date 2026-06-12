import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      storeId: number;
      storeName: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    storeId: number;
    storeName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    storeId: number;
    storeName: string;
  }
}
