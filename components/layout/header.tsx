"use client"

import { useLayout } from "@/context/layout-context"
import { Menu, Bell, Moon, Sun, User } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut, useSession } from "next-auth/react"

export function Header() {
    const { toggleSidebar } = useLayout()
    const { theme, setTheme } = useTheme()
    const { data: session } = useSession()

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
                        <DropdownMenuItem onClick={() => signOut()}>
                            Se déconnecter
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
