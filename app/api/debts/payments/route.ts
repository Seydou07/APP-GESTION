import { auth } from "@/lib/auth"
import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 403 })

        const body = await req.json()
        const { debtId, amount, method, note } = body

        if (!debtId || !amount) {
            return new NextResponse("Champs requis manquants", { status: 400 })
        }

        const userClient = getPrismaStoreClient(session.user.storeId)

        const result = await userClient.$transaction(async (tx) => {
            const debt = await tx.customerDebt.findUnique({ where: { id: Number(debtId) } })
            if (!debt) throw new Error("Dette introuvable")

            const newRemaining = debt.amountDue - Number(amount)
            const newStatus = newRemaining <= 0 ? "SOLDEE" : "EN_COURS"

            const payment = await tx.debtPayment.create({
                data: {
                    debtId: Number(debtId),
                    amount: Number(amount),
                    method: method || "ESPECES",
                    note: note || null,
                    paymentDate: new Date()
                }
            })

            await tx.customerDebt.update({
                where: { id: Number(debtId) },
                data: {
                    amountDue: Math.max(0, newRemaining),
                    status: newStatus as any,
                }
            })

            return payment
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[DEBT_PAYMENTS_POST]", error)
        return new NextResponse(error.message || "Internal Error", { status: 400 })
    }
}

