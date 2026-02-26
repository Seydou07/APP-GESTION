import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { startOfDay, subDays } from "date-fns"

export async function GET() {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const last30Days = subDays(new Date(), 29)
        const todayStart = startOfDay(new Date())

        const [rawTopProducts, allProducts, todaySales, debtStats] = await Promise.all([
            // Top produits vendus (30 derniers jours)
            prisma.ventePersistante.groupBy({
                by: ["designation"],
                where: { date: { gte: last30Days } },
                _sum: { quantite: true, total: true },
                orderBy: { _sum: { total: "desc" } },
                take: 6,
            }),

            // Tous les produits pour filtrer les alertes en JS
            prisma.produit.findMany({
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
            prisma.ventePersistante.findMany({
                where: { date: { gte: todayStart } },
                select: { date: true, total: true },
            }),

            // Stats dettes
            prisma.dette.groupBy({
                by: ["statut"],
                _count: { id: true },
                _sum: { montantTotal: true, montantVerse: true },
            }),
        ])

        // Produits sous seuil alerte
        const stockAlerts = allProducts
            .filter(p => p.quantite <= p.seuilAlerte)
            .slice(0, 8)

        // Format top products
        const topProducts = rawTopProducts.map(p => ({
            name: p.designation.length > 22 ? p.designation.substring(0, 22) + "…" : p.designation,
            fullName: p.designation,
            quantite: p._sum.quantite || 0,
            total: p._sum.total || 0,
        }))

        // Format hourly sales (6h–22h)
        const hoursMap: Record<number, number> = {}
        todaySales.forEach(s => {
            const h = new Date(s.date).getHours()
            hoursMap[h] = (hoursMap[h] || 0) + s.total
        })
        const hourlySales = Array.from({ length: 17 }, (_, i) => {
            const h = i + 6
            return { heure: `${String(h).padStart(2, "0")}h`, total: hoursMap[h] || 0 }
        })

        // Format debt stats
        const debtSummary = {
            impaye: debtStats.find(d => d.statut === "IMPAYE")?._count?.id || 0,
            partiel: debtStats.find(d => d.statut === "PARTIEL")?._count?.id || 0,
            regle: debtStats.find(d => d.statut === "REGLE")?._count?.id || 0,
            totalDu: debtStats.reduce((sum, d) => {
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
