import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { InaugurationDisplay } from "@/components/ui/inauguration-display"

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
        <>
            <InaugurationDisplay />
            <DashboardShell userName={session.user?.name}>
                {children}
            </DashboardShell>
        </>
    )
}
