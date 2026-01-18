import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
    // Correct matcher to protect dashboard routes and exclude public/api assets
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
