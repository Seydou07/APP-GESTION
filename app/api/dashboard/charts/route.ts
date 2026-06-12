import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient(session.user.storeId)

        const url = new URL(request.url)
        const distType = url.searchParams.get("distType") || "produit"

        // Top products by sales volume (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const topSalesItems = await userClient.saleItem.findMany({
            where: {
                sale: { saleDate: { gte: thirtyDaysAgo } }
            },
            include: {
                product: { include: { category: true } }
            }
        })

        const productMap = new Map<string, { designation: string; totalQty: number; totalRevenue: number }>()
        const distMap = new Map<string, { designation: string; totalQty: number; totalRevenue: number }>()
        
        for (const item of topSalesItems) {
            // For top products
            const key = item.designation
            const existing = productMap.get(key) || { designation: key, totalQty: 0, totalRevenue: 0 }
            existing.totalQty += item.quantity
            existing.totalRevenue += item.subtotal
            productMap.set(key, existing)

            // For distribution (product or category)
            const distKey = distType === "categorie" ? (item.product?.category?.name || "Sans catégorie") : item.designation
            const existingDist = distMap.get(distKey) || { designation: distKey, totalQty: 0, totalRevenue: 0 }
            existingDist.totalQty += item.quantity
            existingDist.totalRevenue += item.subtotal
            distMap.set(distKey, existingDist)
        }

        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10)
            
        const distributionData = Array.from(distMap.values())
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10)

        // Stock alerts (boutique)
        const products = await userClient.product.findMany({
            include: {
                stockLevels: { where: { warehouseId: 1 } },
                category: { select: { name: true } }
            },
            orderBy: { stockMin: "asc" }
        })

        const stockAlerts = products
            .filter(p => (p.stockLevels?.[0]?.quantity ?? 0) <= p.stockMin)
            .map(p => ({
                id: p.id,
                name: p.name,
                code: p.code,
                quantity: p.stockLevels?.[0]?.quantity ?? 0,
                stockMin: p.stockMin,
                category: p.category?.name || "-",
            }))
            .slice(0, 20)

        // Hourly sales today
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todaySales = await userClient.sale.findMany({
            where: { saleDate: { gte: startOfDay } },
            select: { saleDate: true, totalTtc: true }
        })

        const hourlyMap: Record<string, number> = {}
        for (let h = 0; h < 24; h++) {
            hourlyMap[`${h}h`] = 0
        }
        for (const sale of todaySales) {
            const hour = new Date(sale.saleDate).getHours()
            hourlyMap[`${hour}h`] += sale.totalTtc
        }
        const hourlySales = Object.entries(hourlyMap).map(([hour, total]) => ({ hour, total }))

        // Debt summary
        const debts = await userClient.customerDebt.findMany({
            select: { amountDue: true, status: true }
        })
        const totalDebtAmount = debts.reduce((sum, d) => sum + d.amountDue, 0)
        const pendingDebts = debts.filter(d => d.status !== "SOLDEE").length

        return NextResponse.json({
            topProducts,
            distributionData,
            stockAlerts,
            hourlySales,
            debtSummary: {
                totalRemaining: totalDebtAmount,
                pendingCount: pendingDebts,
                totalDebts: debts.length,
            }
        })
    } catch (error) {
        console.error("[DASHBOARD_CHARTS]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
