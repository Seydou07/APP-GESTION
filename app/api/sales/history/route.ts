import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { startOfDay, endOfDay, parseISO } from "date-fns"

export async function GET(req: Request) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")
        const query = searchParams.get("query")

        let where: any = {}

        if (startDate && endDate) {
            where.date = {
                gte: startOfDay(parseISO(startDate)),
                lte: endOfDay(parseISO(endDate)),
            }
        }

        if (query) {
            where.OR = [
                { nomClient: { contains: query, mode: 'insensitive' } },
                { transactionId: { contains: query, mode: 'insensitive' } },
            ]
        }

        const sales = await prisma.ventePersistante.findMany({
            where,
            orderBy: {
                date: "desc"
            }
        })

        // Group by transactionId
        const groupedSales = sales.reduce((acc: any, sale: any) => {
            const key = sale.transactionId || `legacy-${sale.id}`
            if (!acc[key]) {
                acc[key] = {
                    transactionId: key,
                    date: sale.date,
                    nomClient: sale.nomClient,
                    prenomClient: sale.prenomClient,
                    numeroClient: sale.numeroClient,
                    items: [],
                    total: 0
                }
            }
            acc[key].items.push(sale)
            acc[key].total += sale.total
            return acc
        }, {})

        return NextResponse.json(Object.values(groupedSales))
    } catch (error) {
        console.error("[SALES_HISTORY_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
