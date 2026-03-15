import { auth } from "@/lib/auth"
import { getPrismaUserClient } from "@/lib/prisma"
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
        const userClient = getPrismaUserClient((session.user as any).boutiqueId);

        // Transaction: Update Debt Status AND Record Payment
        const result = await userClient.$transaction(async (tx) => {
            const debt = await tx.dette.findUnique({
                where: { id: Number(id) }
            })

            if (!debt) throw new Error("Dette introuvable")

            const nouveauMontantVerse = debt.montantVerse + montantPaye

            if (nouveauMontantVerse > debt.montantTotal) {
                throw new Error("Le montant versé dépasse le total de la dette")
            }

            let nouveauStatut = "PARTIEL"
            if (nouveauMontantVerse >= debt.montantTotal) {
                nouveauStatut = "REGLE"
            }

            // 1. Update Debt
            const updatedDebt = await tx.dette.update({
                where: { id: Number(id) },
                data: {
                    montantVerse: nouveauMontantVerse,
                    statut: nouveauStatut as any,
                }
            })

            // 2. Create Payment Record
            await tx.paiementDette.create({
                data: {
                    detteId: Number(id),
                    montant: montantPaye,
                    note,
                    date: new Date()
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
