import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLayout } from "@/context/layout-context"
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    History,
    Database,
    Settings,
    LogOut,
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
    const { isSidebarCollapsed } = useLayout()

    return (
        <div className={cn(
            "fixed top-0 left-0 h-full bg-sidebar z-50 transition-all duration-300 font-sans border-r shadow-sm print:hidden",
            isSidebarCollapsed ? "w-20" : "w-72"
        )}>
            <div className={cn(
                "flex items-center p-6 mb-8 text-primary font-extrabold text-2xl transition-all duration-300",
                isSidebarCollapsed ? "justify-center px-0" : "px-6"
            )}>
                <span className={isSidebarCollapsed ? "text-xl" : "ml-2"}>
                    {isSidebarCollapsed ? "K" : "K.M.BOMI"}
                </span>
            </div>

            <nav className="flex flex-col gap-2 px-3">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 py-3 rounded-xl transition-all group relative",
                                isSidebarCollapsed ? "justify-center px-0" : "px-4",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-primary"
                            )}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 min-w-[20px] transition-transform group-hover:scale-110",
                                isActive ? "text-white" : ""
                            )} />
                            {!isSidebarCollapsed && (
                                <span className="whitespace-nowrap font-medium">{item.label}</span>
                            )}
                            {isSidebarCollapsed && isActive && (
                                <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                            )}
                        </Link>
                    )
                })}

                <button
                    onClick={() => signOut()}
                    className={cn(
                        "flex items-center gap-4 py-3 rounded-xl transition-all text-destructive hover:bg-destructive/10 mt-10",
                        isSidebarCollapsed ? "justify-center px-0" : "px-4"
                    )}
                >
                    <LogOut className="h-5 w-5 min-w-[20px]" />
                    {!isSidebarCollapsed && <span className="whitespace-nowrap font-medium">Déconnexion</span>}
                </button>
            </nav>
        </div>
    )
}
