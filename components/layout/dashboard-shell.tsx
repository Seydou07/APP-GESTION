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
        <div className="min-h-screen bg-muted/30 h-screen overflow-hidden">
            <Sidebar />
            <div className={cn(
                "transition-all duration-300 h-screen flex flex-col overflow-hidden",
                isSidebarCollapsed ? "ml-20" : "ml-72",
                "print:ml-0"
            )}>
                <Header />
                <main className="flex-1 p-6 md:p-8 print:p-0 overflow-y-auto no-scrollbar">
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
