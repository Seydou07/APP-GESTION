import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        // Run all queries in parallel for maximum performance
        const [salesSum, productCount, uniqueClients] = await Promise.all([
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
            })
        ])

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

        return NextResponse.json(stats)
    } catch (error: any) {
        console.error("Dashboard Stats Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
