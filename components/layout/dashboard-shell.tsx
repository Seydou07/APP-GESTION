"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { useLayout } from "@/context/layout-context"
import { cn } from "@/lib/utils"

export function DashboardShell({
    children,
    userName
}: {
    children: React.ReactNode
    userName?: string | null
}) {
    const { isSidebarCollapsed } = useLayout()

    return (
        <div className="min-h-screen bg-muted/30">
            <Sidebar />
            <div className={cn(
                "transition-all duration-300 min-h-screen flex flex-col",
                isSidebarCollapsed ? "ml-20" : "ml-72",
                "print:ml-0"
            )}>
                <Header />
                <main className="flex-1 p-6 md:p-8 print:p-0">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
