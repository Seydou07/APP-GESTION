"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { LayoutProvider } from "@/context/layout-context"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SessionProvider>
                <LayoutProvider>
                    <TooltipProvider>
                        {children}
                    </TooltipProvider>
                </LayoutProvider>
            </SessionProvider>
        </ThemeProvider>
    )
}
