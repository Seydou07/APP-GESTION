import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, format } from "date-fns"
import { fr } from "date-fns/locale"

export async function GET() {
    try {
        const last7Days = subDays(new Date(), 6)

        // Run all queries in parallel for maximum performance
        const [salesSum, productCount, uniqueClients, chartSales] = await Promise.all([
            prisma.ventePersistante.aggregate({
                _sum: {
                    total: true
                }
            }),
            prisma.produit.count(),
            prisma.ventePersistante.groupBy({
                by: ['numeroClient'],
                where: {
                    numeroClient: {
                        not: null
                    }
                }
            }),
            prisma.ventePersistante.findMany({
                where: {
                    date: {
                        gte: startOfDay(last7Days)
                    }
                },
                select: {
                    date: true,
                    total: true
                }
            })
        ])

        // Process chart data
        const days = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), 6 - i)
            return {
                name: format(date, "EEE", { locale: fr }),
                fullDate: format(date, "yyyy-MM-dd"),
                total: 0
            }
        })

        chartSales.forEach(sale => {
            const dateKey = format(sale.date, "yyyy-MM-dd")
            const day = days.find(d => d.fullDate === dateKey)
            if (day) {
                day.total += sale.total
            }
        })

        const stats = [
            {
                label: "Ventes Totales",
                rawValue: salesSum._sum.total || 0,
                type: "currency"
            },
            {
                label: "Nouveaux Produits",
                rawValue: productCount,
                type: "number"
            },
            {
                label: "Clients",
                rawValue: uniqueClients.length,
                type: "number"
            }
        ]

        return NextResponse.json({
            stats,
            chartData: days.map(({ name, total }) => ({ name, total }))
        })
    } catch (error: any) {
        console.error("Dashboard Stats Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
