"use client"

import React, { createContext, useContext, useState } from "react"

interface LayoutContextType {
    isSidebarCollapsed: boolean
    toggleSidebar: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev)

    return (
        <LayoutContext.Provider value={{ isSidebarCollapsed, toggleSidebar }}>
            {children}
        </LayoutContext.Provider>
    )
}

export function useLayout() {
    const context = useContext(LayoutContext)
    if (context === undefined) {
        throw new Error("useLayout must be used within a LayoutProvider")
    }
    return context
}
