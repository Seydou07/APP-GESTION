import type { NextAuthConfig } from "next-auth";
import { z } from "zod";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.boutiqueId = (user as any).boutiqueId; // Storing boutiqueId in JWT
                token.boutiqueName = (user as any).boutiqueName;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                (session.user as any).role = token.role;
                (session.user as any).boutiqueId = token.boutiqueId; // Adding boutiqueId to the session
                (session.user as any).boutiqueName = token.boutiqueName;
            }
            return session;
        },
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user;
            const isDashboardRoute =
                request.nextUrl.pathname === "/" ||
                request.nextUrl.pathname.startsWith("/products") ||
                request.nextUrl.pathname.startsWith("/sales") ||
                request.nextUrl.pathname.startsWith("/stock") ||
                request.nextUrl.pathname.startsWith("/settings");

            if (isDashboardRoute) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }
            return true;
        },
    },
    providers: [], // Providers are added in auth.ts for full config
} satisfies NextAuthConfig;
