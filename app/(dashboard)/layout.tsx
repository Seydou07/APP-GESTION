import { Sidebar } from "@/components/layout/sidebar"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="flex min-h-screen bg-muted/30">
            <Sidebar />
            <main className="flex-1 ml-72 p-8 transition-all duration-300">
                <header className="flex items-center justify-between mb-10">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold tracking-tight">Bonjour, {session.user?.name}</h1>
                        <p className="text-muted-foreground">Voici ce qu'il se passe aujourd'hui.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* User Profile / Notifications could go here */}
                    </div>
                </header>
                {children}
            </main>
        </div>
    )
}
