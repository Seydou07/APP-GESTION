"use client"

import { useState } from "react"
import { useLayout } from "@/context/layout-context"
import { Menu, Bell, Moon, Sun, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut, useSession } from "next-auth/react"

export function Header() {
    const { toggleSidebar } = useLayout()
    const { theme, setTheme } = useTheme()
    const { data: session } = useSession()
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

    const handleSignOut = () => {
        signOut()
    }

    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/95 px-6 backdrop-blur print:hidden">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="rounded-xl">
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="flex flex-col">
                    <h2 className="text-sm font-semibold">Tableau de bord</h2>
                    <p className="text-xs text-muted-foreground">{session?.user?.name || "Administrateur"}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Changer de thème</span>
                </Button>

                <Button variant="ghost" size="icon" className="rounded-xl relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-2">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {session?.user?.name?.substring(0, 2).toUpperCase() || "AD"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsLogoutDialogOpen(true)} className="text-destructive focus:text-destructive cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Se déconnecter</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
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
        </header>
    )
}
