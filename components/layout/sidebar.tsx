import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLayout } from "@/context/layout-context"
import { useSession } from "next-auth/react"
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    History,
    Database,
    Settings,
    HelpCircle,
    LogOut,
    Lightbulb,
    Wallet,
    Users,
    BookUser,
    Warehouse,
    FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { SuggestionsDialog } from "./suggestions-dialog"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function Sidebar() {
    const pathname = usePathname()
    const { isSidebarCollapsed } = useLayout()
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
    const { data: session } = useSession()

    const isAdmin = (session?.user as any)?.role === "ADMIN"
    const boutiqueName = (session?.user as any)?.storeName || ""

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: ShoppingCart, label: "Vendre", href: "/sales" },
        { icon: History, label: "Historique", href: "/sales/history" },
        // Admin Only Links
        ...(isAdmin ? [
            { icon: Package, label: "Produits", href: "/products" },
            { icon: Database, label: "Stocks", href: "/stock" },
            { icon: Warehouse, label: "Magasin", href: "/magasin" },
            { icon: Wallet, label: "Caisse", href: "/cash" },
            { icon: FileText, label: "Factures", href: "/invoices" },
            { icon: Wallet, label: "Dépenses", href: "/expenses" },
            { icon: Users, label: "Employés", href: "/employees" },
            { icon: BookUser, label: "Dettes / Crédits", href: "/debts" },
            { icon: Users, label: "Utilisateurs", href: "/users" },
            { icon: Users, label: "Clients", href: "/clients" },
            { icon: BookUser, label: "Fournisseurs", href: "/suppliers" },
            { icon: ShoppingCart, label: "Achats", href: "/purchases" },
        ] : []),
        { icon: Settings, label: "Paramètres", href: "/settings" },
        { icon: HelpCircle, label: "Aide & Support", href: "/help" },
    ]

    const handleSignOut = () => {
        signOut()
    }

    return (
        <div className={cn(
            "fixed top-0 left-0 h-screen bg-sidebar z-50 transition-all duration-300 font-sans border-r shadow-sm print:hidden flex flex-col overflow-hidden",
            isSidebarCollapsed ? "w-20" : "w-72"
        )}>
            {/* Sidebar Header - Reduced padding */}
            <div className={cn(
                "flex flex-col items-start p-4 mb-2 transition-all duration-300 flex-shrink-0",
                isSidebarCollapsed ? "justify-center px-0 items-center" : "px-4"
            )}>
                <div className="flex items-center text-primary font-extrabold text-xl">
                    <span className={isSidebarCollapsed ? "text-lg" : "ml-2"}>
                        {isSidebarCollapsed ? "N" : "Nexio"}
                    </span>
                </div>
            </div>

            {/* Scrollable Navigation */}
            <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 py-2.5 rounded-lg transition-all group relative shrink-0",
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
                                <span className="whitespace-nowrap font-semibold text-sm">{item.label}</span>
                            )}
                            {isSidebarCollapsed && isActive && (
                                <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                            )}
                        </Link>
                    )
                })}

                <div className="my-2 border-t border-sidebar-accent/10 shrink-0" />

                <SuggestionsDialog>
                    <button
                        className={cn(
                            "flex items-center gap-4 py-2.5 rounded-xl transition-all group relative shrink-0",
                            isSidebarCollapsed ? "justify-center px-0" : "px-4",
                            "text-sidebar-foreground hover:bg-primary/10 hover:text-primary"
                        )}
                    >
                        <Lightbulb className={cn(
                            "h-5 w-5 min-w-[20px] transition-transform group-hover:scale-110 text-amber-500",
                        )} />
                        {!isSidebarCollapsed && (
                            <span className="whitespace-nowrap font-semibold text-sm">Suggestions & Idées</span>
                        )}
                    </button>
                </SuggestionsDialog>
            </nav>

            {/* Fixed Logout Button at the bottom */}
            <div className="flex-shrink-0 p-3 border-t border-sidebar-accent/10">
                <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                    <DialogTrigger asChild>
                        <button
                            className={cn(
                                "flex items-center gap-4 py-2.5 rounded-xl transition-all text-destructive hover:bg-destructive/10 w-full text-left",
                                isSidebarCollapsed ? "justify-center px-0" : "px-4"
                            )}
                        >
                            <LogOut className="h-5 w-5 min-w-[20px]" />
                            {!isSidebarCollapsed && <span className="whitespace-nowrap font-semibold text-sm">Déconnexion</span>}
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-3xl p-8 border-none shadow-2xl">
                        <DialogHeader className="space-y-4">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto sm:mx-0">
                                <LogOut className="w-8 h-8 text-destructive" />
                            </div>
                            <div className="space-y-2">
                                <DialogTitle className="text-2xl font-bold">Confirmer la déconnexion</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-lg">
                                    Êtes-vous sûr de vouloir vous déconnecter de votre session ?
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                        <DialogFooter className="mt-8 flex gap-3 sm:gap-4">
                            <DialogClose asChild>
                                <Button variant="ghost" className="flex-1 h-12 rounded-xl text-base font-medium">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={handleSignOut}
                                className="flex-1 h-12 rounded-xl text-base font-bold shadow-lg shadow-destructive/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Déconnexion
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
