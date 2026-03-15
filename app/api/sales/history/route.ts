import { getPrismaUserClient } from "@/lib/prisma"
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

        const userClient = getPrismaUserClient((session.user as any).boutiqueId);

        const sales = await userClient.ventePersistante.findMany({
            where,
            orderBy: {
                date: "desc"
            }
        })

        // Fetch debt payments within same range
        const debtPayments = await userClient.paiementDette.findMany({
            where: {
                date: where.date,
                dette: query ? {
                    nomClient: { contains: query, mode: 'insensitive' }
                } : undefined
            },
            include: {
                dette: true
            },
            orderBy: {
                date: "desc"
            }
        })

        // Group by transactionId
        const groupedData = sales.reduce((acc: any, sale: any) => {
            const key = sale.transactionId || `legacy-${sale.id}`
            if (!acc[key]) {
                acc[key] = {
                    transactionId: key,
                    date: sale.date,
                    nomClient: sale.nomClient,
                    prenomClient: sale.prenomClient,
                    numeroClient: sale.numeroClient,
                    type: "VENTE",
                    items: [],
                    total: 0
                }
            }
            acc[key].items.push(sale)
            acc[key].total += sale.total
            return acc
        }, {})

        // Add debt payments as their own entries
        debtPayments.forEach((payment: any) => {
            const key = `PAY-TRX-${payment.id}`
            const debtItems = typeof payment.dette.items === 'string'
                ? JSON.parse(payment.dette.items)
                : payment.dette.items

            groupedData[key] = {
                transactionId: key,
                date: payment.date,
                nomClient: payment.dette.nomClient,
                prenomClient: "",
                numeroClient: payment.dette.telephone,
                type: "VERSEMENT_DETTE",
                items: debtItems.map((item: any) => ({
                    ...item,
                    total: item.prixUnitaire * item.quantite
                })),
                total: payment.montant,
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
