import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { startOfDay, endOfDay, parseISO } from "date-fns"

export async function GET(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")
        const query = searchParams.get("query")

        let where: any = {}

        if (startDate && endDate) {
            where.saleDate = {
                gte: startOfDay(parseISO(startDate)),
                lte: endOfDay(parseISO(endDate)),
            }
        }

        if (query) {
            where.OR = [
                { transactionId: { contains: query, mode: 'insensitive' } },
                { items: { some: { designation: { contains: query, mode: 'insensitive' } } } },
            ]
        }

        const userClient = getPrismaStoreClient((session.user as any).storeId);

        const sales = await userClient.sale.findMany({
            where,
            include: { items: true },
            orderBy: { saleDate: "desc" }
        })

        // Fetch debt payments within same range
        const dateFilter = startDate && endDate ? {
            paymentDate: {
                gte: startOfDay(parseISO(startDate)),
                lte: endOfDay(parseISO(endDate)),
            }
        } : {}

        const debtPayments = await userClient.debtPayment.findMany({
            where: {
                ...dateFilter,
                debt: query ? {
                    client: { name: { contains: query, mode: 'insensitive' } }
                } : undefined
            },
            include: {
                debt: { include: { client: true } }
            },
            orderBy: { paymentDate: "desc" }
        })

        // Group by transactionId
        const groupedData = sales.reduce((acc: any, sale: any) => {
            const key = sale.transactionId || `legacy-${sale.id}`
            if (!acc[key]) {
                acc[key] = {
                    transactionId: key,
                    date: sale.saleDate,
                    nomClient: sale.clientId ? undefined : undefined,
                    type: "VENTE",
                    items: [],
                    total: 0,
                    totalTtc: sale.totalTtc,
                    paidAmount: sale.paidAmount,
                    status: sale.status,
                    paymentMethod: sale.paymentMethod,
                    discount: sale.discount,
                    commission: sale.commission,
                }
            }
            if (sale.items) {
                acc[key].items.push(...sale.items)
            }
            acc[key].total += sale.totalTtc
            return acc
        }, {})

        // Add debt payments as their own entries
        debtPayments.forEach((payment: any) => {
            const key = `PAY-TRX-${payment.id}`

            groupedData[key] = {
                transactionId: key,
                date: payment.paymentDate,
                nomClient: payment.debt?.client?.name || "Client",
                type: "VERSEMENT_DETTE",
                items: [],
                total: payment.amount,
                note: payment.note
            }
        })

        // Sort everything by date desc
        const result = Object.values(groupedData).sort((a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        return NextResponse.json(result)
    } catch (error) {
        console.error("[SALES_HISTORY_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
