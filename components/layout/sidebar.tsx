"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    History,
    Database,
    Settings,
    LogOut,
    Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: ShoppingCart, label: "Vendre", href: "/sales" },
    { icon: Package, label: "Produits", href: "/products" },
    { icon: Database, label: "Stocks", href: "/stock" },
    { icon: History, label: "Historique", href: "/sales/history" },
    { icon: Settings, label: "Paramètres", href: "/settings" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="fixed top-0 left-0 w-72 h-full bg-sidebar z-50 transition-all duration-300 font-sans border-r shadow-sm">
            <div className="flex items-center p-6 mb-8 text-primary font-bold text-2xl">
                <span className="ml-2">K.M.BOMI</span>
            </div>

            <nav className="flex flex-col gap-2 px-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-l-full transition-all group relative",
                                isActive
                                    ? "bg-background text-primary ml-4 shadow-[-10px_0_0_var(--sidebar)]"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary"
                            )}
                        >
                            {isActive && (
                                <>
                                    <div className="absolute top-[-40px] right-0 w-10 h-10 rounded-full bg-transparent shadow-[20px_20px_0_var(--background)] pointer-events-none" />
                                    <div className="absolute bottom-[-40px] right-0 w-10 h-10 rounded-full bg-transparent shadow-[20px_-20px_0_var(--background)] pointer-events-none" />
                                </>
                            )}
                            <item.icon className="w-5 h-5 min-w-[20px]" />
                            <span className="whitespace-nowrap font-medium">{item.label}</span>
                        </Link>
                    )
                })}

                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-4 px-4 py-3 rounded-l-full transition-all text-destructive hover:bg-destructive/10 mt-10 ml-4"
                >
                    <LogOut className="w-5 h-5 min-w-[20px]" />
                    <span className="whitespace-nowrap font-medium">Déconnexion</span>
                </button>
            </nav>
        </div>
    )
}
