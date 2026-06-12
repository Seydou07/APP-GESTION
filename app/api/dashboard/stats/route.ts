import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient(session.user.storeId)
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfWeek = new Date(startOfDay)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfYear = new Date(now.getFullYear(), 0, 1)

        // Today's sales
        const todaySales = await userClient.sale.findMany({
            where: { saleDate: { gte: startOfDay } },
            include: { items: { select: { costPrice: true, quantity: true } } }
        })
        const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalTtc, 0)
        const todayCOGS = todaySales.reduce((sum, s) => 
            sum + s.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0), 0)

        // Monthly sales
        const monthSales = await userClient.sale.findMany({
            where: { saleDate: { gte: startOfMonth } },
            include: { items: { select: { costPrice: true, quantity: true } } }
        })
        const monthRevenue = monthSales.reduce((sum, s) => sum + s.totalTtc, 0)
        const monthCOGS = monthSales.reduce((sum, s) => 
            sum + s.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0), 0)

        // Yearly sales
        const yearSales = await userClient.sale.findMany({
            where: { saleDate: { gte: startOfYear } },
            include: { items: { select: { costPrice: true, quantity: true } } }
        })
        const yearRevenue = yearSales.reduce((sum, s) => sum + s.totalTtc, 0)
        const yearCOGS = yearSales.reduce((sum, s) => 
            sum + s.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0), 0)

        // Monthly expenses
        const monthExpenses = await userClient.expense.findMany({
            where: { expenseDate: { gte: startOfMonth } },
            select: { amount: true }
        })
        const totalMonthExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

        // Calculate profit
        const todayProfit = todayRevenue - todayCOGS
        const monthProfit = monthRevenue - monthCOGS - totalMonthExpenses
        const yearProfit = yearRevenue - yearCOGS

        // Total products count
        const productCount = await userClient.product.count()

        // Total clients count
        const clientsCount = await userClient.client.count()

        // Total sales count
        const totalSalesCount = await userClient.sale.count()

        // Total stock quantity
        const stockLevels = await userClient.stockLevel.findMany({
            select: { quantity: true }
        })
        const totalStock = stockLevels.reduce((sum, s) => sum + s.quantity, 0)

        // Total customer debts (remaining)
        const debts = await userClient.customerDebt.findMany({
            where: { status: { not: "SOLDEE" } },
            select: { amountDue: true }
        })
        const totalCustomerDebt = debts.reduce((sum, d) => sum + d.amountDue, 0)

        // Cash balance calculation
        const cashMovements = await userClient.cashMovement.findMany({
            select: { type: true, amount: true }
        })
        const cashIn = cashMovements.filter(m => m.type === "ENTREE").reduce((sum, m) => sum + m.amount, 0)
        const cashOut = cashMovements.filter(m => m.type === "SORTIE").reduce((sum, m) => sum + m.amount, 0)
        const cashBalance = cashIn - cashOut

        const url = new URL(request.url)
        const period = url.searchParams.get("period") || "jour"

        // Chart data
        const chartData = []
        if (period === "jour") {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const day = new Date(startOfDay)
                day.setDate(day.getDate() - i)
                const nextDay = new Date(day)
                nextDay.setDate(nextDay.getDate() + 1)

                const daySales = await userClient.sale.findMany({
                    where: { saleDate: { gte: day, lt: nextDay } },
                    select: { totalTtc: true }
                })
                const total = daySales.reduce((sum, s) => sum + s.totalTtc, 0)
                const count = daySales.length

                chartData.push({
                    date: day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
                    total,
                    count,
                })
            }
        } else if (period === "semaine") {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(startOfWeek)
                weekStart.setDate(weekStart.getDate() - (i * 7))
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekEnd.getDate() + 7)

                const weekSales = await userClient.sale.findMany({
                    where: { saleDate: { gte: weekStart, lt: weekEnd } },
                    select: { totalTtc: true }
                })
                const total = weekSales.reduce((sum, s) => sum + s.totalTtc, 0)
                const count = weekSales.length

                chartData.push({
                    date: `Sem. ${i === 0 ? 'en cours' : -i}`,
                    total,
                    count,
                })
            }
        } else if (period === "mois") {
            // Last 6 months
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(startOfMonth)
                monthDate.setMonth(monthDate.getMonth() - i)
                const nextMonth = new Date(monthDate)
                nextMonth.setMonth(nextMonth.getMonth() + 1)

                const monthSalesObj = await userClient.sale.findMany({
                    where: { saleDate: { gte: monthDate, lt: nextMonth } },
                    select: { totalTtc: true }
                })
                const total = monthSalesObj.reduce((sum, s) => sum + s.totalTtc, 0)
                const count = monthSalesObj.length

                chartData.push({
                    date: monthDate.toLocaleDateString("fr-FR", { month: "short" }),
                    total,
                    count,
                })
            }
        }

        // Stock alerts count
        const products = await userClient.product.findMany({
            include: {
                stockLevels: { where: { warehouseId: 1 } }
            }
        })
        const stockAlerts = products.filter(p =>
            (p.stockLevels?.[0]?.quantity ?? 0) <= p.stockMin
        ).length

        return NextResponse.json({
            stats: [
                { label: "CA du Jour", rawValue: todayRevenue, type: "currency" },
                { label: "CA du Mois", rawValue: monthRevenue, type: "currency" },
                { label: "CA de l'Année", rawValue: yearRevenue, type: "currency" },
                { label: "Bénéfice Jour", rawValue: todayProfit, type: "currency" },
                { label: "Bénéfice Mois", rawValue: monthProfit, type: "currency" },
                { label: "Bénéfice Année", rawValue: yearProfit, type: "currency" },
                { label: "Solde Caisse", rawValue: cashBalance, type: "currency" },
                { label: "Produits", rawValue: productCount, type: "number" },
                { label: "Clients", rawValue: clientsCount, type: "number" },
                { label: "Stock Total", rawValue: totalStock, type: "number" },
                { label: "Dépenses Mois", rawValue: totalMonthExpenses, type: "currency" },
                { label: "Créances Clients", rawValue: totalCustomerDebt, type: "currency" },
                { label: "Alertes Stock", rawValue: stockAlerts, type: "number" },
            ],
            chartData,
            stockAlerts,
        })
    } catch (error) {
        console.error("[DASHBOARD_STATS]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
