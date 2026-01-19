"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { LayoutProvider } from "@/context/layout-context"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SessionProvider>
                <LayoutProvider>
                    {children}
                </LayoutProvider>
            </SessionProvider>
        </ThemeProvider>
    )
}
