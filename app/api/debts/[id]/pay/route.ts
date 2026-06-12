import { auth } from "@/lib/auth"
import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

        const params = await props.params;
        const { id } = params
        const body = await req.json()
        const { montant, note } = body

        if (!montant || Number(montant) <= 0) {
            return new NextResponse("Montant invalide", { status: 400 })
        }

        const montantPaye = Number(montant)
        const userClient = getPrismaStoreClient((session.user as any).storeId);

        const result = await userClient.$transaction(async (tx) => {
            const debt = await tx.customerDebt.findUnique({
                where: { id: Number(id) }
            })

            if (!debt) throw new Error("Dette introuvable")

            const nouveauMontantRestant = debt.amountDue - montantPaye

            if (nouveauMontantRestant < 0) {
                throw new Error("Le montant versé dépasse le solde de la dette")
            }

            let nouveauStatut = "EN_COURS"
            if (nouveauMontantRestant <= 0) {
                nouveauStatut = "SOLDEE"
            }

            // 1. Update Debt
            const updatedDebt = await tx.customerDebt.update({
                where: { id: Number(id) },
                data: {
                    amountDue: nouveauMontantRestant < 0 ? 0 : nouveauMontantRestant,
                    status: nouveauStatut as any,
                }
            })

            // 2. Create Payment Record
            const payment = await tx.debtPayment.create({
                data: {
                    debtId: Number(id),
                    amount: montantPaye,
                    note,
                    paymentDate: new Date()
                }
            })

            // 3. Create Cash Movement
            await tx.cashMovement.create({
                data: {
                    type: "ENTREE",
                    source: "DETTE",
                    referenceId: payment.id,
                    amount: montantPaye,
                    note: note || `Règlement dette client #${id}`,
                    moveDate: new Date()
                }
            })

            return updatedDebt
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[DEBT_PAY_POST]", error)
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
