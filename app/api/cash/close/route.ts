import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { totalPhysical, billetterie, motif } = body

        if (totalPhysical === undefined || typeof totalPhysical !== "number") {
            return new NextResponse("Montant physique manquant ou invalide", { status: 400 })
        }

        const userClient = getPrismaStoreClient(session.user.storeId)

        // 1. Calculate theoretical balance
        const allMovements = await userClient.cashMovement.findMany({
            select: { type: true, amount: true }
        })

        const totalTheoretical = allMovements.reduce((sum, mov) => {
            if (mov.type === "ENTREE") return sum + mov.amount
            return sum - mov.amount
        }, 0)

        const difference = totalPhysical - totalTheoretical

        const result = await userClient.$transaction(async (tx) => {
            let adjustmentMovement = null

            // 2. Impute gap if any difference
            if (difference < 0) {
                // Deficit -> SORTIE
                adjustmentMovement = await tx.cashMovement.create({
                    data: {
                        type: "SORTIE",
                        source: "RETRAIT",
                        amount: Math.abs(difference),
                        note: `Écart de caisse (Déficit) - ${motif || "Pas de motif spécifié"}`,
                        userId: Number(session.user.id),
                        moveDate: new Date()
                    }
                })
            } else if (difference > 0) {
                // Surplus -> ENTREE
                adjustmentMovement = await tx.cashMovement.create({
                    data: {
                        type: "ENTREE",
                        source: "APPORTS",
                        amount: difference,
                        note: `Écart de caisse (Surplus) - ${motif || "Pas de motif spécifié"}`,
                        userId: Number(session.user.id),
                        moveDate: new Date()
                    }
                })
            }

            // 3. Log session closure in ActivityLog
            const log = await tx.activityLog.create({
                data: {
                    action: "SESSION_CLOSING",
                    tableName: "mouvements_caisse",
                    recordId: adjustmentMovement ? adjustmentMovement.id : null,
                    details: {
                        totalPhysical,
                        totalTheoretical,
                        difference,
                        billetterie,
                        motif: motif || "",
                        operator: session.user.name || "Inconnu"
                    }
                }
            })

            return {
                totalTheoretical,
                totalPhysical,
                difference,
                adjustmentId: adjustmentMovement?.id || null,
                logId: log.id
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("[CASH_CLOSE_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
