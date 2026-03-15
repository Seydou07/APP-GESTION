import { NextResponse } from "next/server"
import { getPrismaUserClient } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { startOfDay, subDays } from "date-fns"

export async function GET() {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const last30Days = subDays(new Date(), 29)
        const todayStart = startOfDay(new Date())

        const userClient = getPrismaUserClient((session.user as any).boutiqueId);

        const [rawTopProducts, allProducts, todaySales, debtStats] = await Promise.all([
            // Top produits vendus (30 derniers jours)
            userClient.ventePersistante.groupBy({
                by: ["designation"],
                where: { date: { gte: last30Days } },
                _sum: { quantite: true, total: true },
                orderBy: { _sum: { total: "desc" } },
                take: 6,
            }),

            // Tous les produits pour filtrer les alertes en JS
            userClient.produit.findMany({
                select: {
                    id: true,
                    designation: true,
                    quantite: true,
                    seuilAlerte: true,
                    categorie: true,
                },
                orderBy: { quantite: "asc" },
            }),

            // Ventes par heure aujourd'hui
            userClient.ventePersistante.findMany({
                where: { date: { gte: todayStart } },
                select: { date: true, total: true },
            }),

            // Stats dettes
            userClient.dette.groupBy({
                by: ["statut"],
                _count: { id: true },
                _sum: { montantTotal: true, montantVerse: true },
            }),
        ])

        // Produits sous seuil alerte
        const stockAlerts = allProducts
            .filter((p: any) => p.quantite <= p.seuilAlerte)
            .slice(0, 8)

        // Format top products
        const topProducts = rawTopProducts.map((p: any) => ({
            name: p.designation.length > 22 ? p.designation.substring(0, 22) + "…" : p.designation,
            fullName: p.designation,
            quantite: p._sum.quantite || 0,
            total: p._sum.total || 0,
        }))

        // Format hourly sales (6h–22h)
        const hoursMap: Record<number, number> = {}
        todaySales.forEach((s: any) => {
            const h = new Date(s.date).getHours()
            hoursMap[h] = (hoursMap[h] || 0) + s.total
        })
        const hourlySales = Array.from({ length: 17 }, (_, i) => {
            const h = i + 6
            return { heure: `${String(h).padStart(2, "0")}h`, total: hoursMap[h] || 0 }
        })

        // Format debt stats
        const debtSummary = {
            impaye: debtStats.find((d: any) => d.statut === "IMPAYE")?._count?.id || 0,
            partiel: debtStats.find((d: any) => d.statut === "PARTIEL")?._count?.id || 0,
            regle: debtStats.find((d: any) => d.statut === "REGLE")?._count?.id || 0,
            totalDu: debtStats.reduce((sum: number, d: any) => {
                if (d.statut === "REGLE") return sum
                return sum + ((d._sum.montantTotal || 0) - (d._sum.montantVerse || 0))
            }, 0),
        }

        return NextResponse.json({ topProducts, stockAlerts, hourlySales, debtSummary })
    } catch (error: any) {
        console.error("Dashboard Charts Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
