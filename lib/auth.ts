import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({
          where: { email },
          include: { store: true, userRoles: { include: { role: true } } }
        });

        if (!user || !user.isActive) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (passwordsMatch) {
          const primaryRole = user.userRoles[0]?.role.name || "VENDEUR";
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.pseudo,
            role: primaryRole,
            storeId: user.storeId,
            storeName: user.store?.name || "Boutique Principale",
          } as any;
        }

        return null;
      },
    }),
  ],
});
