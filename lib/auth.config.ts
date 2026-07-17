import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.storeId = (user as any).storeId;
                token.storeName = (user as any).storeName;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                (session.user as any).role = token.role;
                (session.user as any).storeId = token.storeId;
                (session.user as any).storeName = token.storeName;
            }
            return session;
        },
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user;
            const pathname = request.nextUrl.pathname;

            const isDashboardRoute =
                pathname === "/" ||
                pathname.startsWith("/products") ||
                pathname.startsWith("/sales") ||
                pathname.startsWith("/stock") ||
                pathname.startsWith("/magasin") ||
                pathname.startsWith("/expenses") ||
                pathname.startsWith("/employees") ||
                pathname.startsWith("/debts") ||
                pathname.startsWith("/users") ||
                pathname.startsWith("/settings") ||
                pathname.startsWith("/clients") ||
                pathname.startsWith("/suppliers") ||
                pathname.startsWith("/purchases") ||
                pathname.startsWith("/invoices") ||
                pathname.startsWith("/tickets") ||
                pathname.startsWith("/cash") ||
                pathname.startsWith("/reports") ||
                pathname.startsWith("/catalogues");

            if (isDashboardRoute) {
                if (isLoggedIn) return true;
                return false;
            }
            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
