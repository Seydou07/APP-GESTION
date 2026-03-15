import { auth } from "@/lib/auth"
import { getPrismaUserClient } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        const where: any = {}
        if (status) {
            where.statut = status
        }

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            }
        }

        const userClient = getPrismaUserClient((session.user as any).boutiqueId);
        const debts = await userClient.dette.findMany({
            where,
            orderBy: {
                updatedAt: 'desc'
            },
            include: {
                paiements: true
            }
        })

        return NextResponse.json(debts)
    } catch (error) {
        console.error("[DEBTS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

        const body = await req.json()
        const { items, nomClient, telephone } = body

        if (!items || !Array.isArray(items) || items.length === 0) {
            return new NextResponse("Le panier est vide", { status: 400 })
        }
        if (!nomClient || !telephone) {
            return new NextResponse("Nom et Téléphone obligatoires pour un crédit", { status: 400 })
        }

        const totalAmount = items.reduce((sum: number, item: any) => sum + ((item.prixUnitaire || 0) * item.quantite), 0)
        const userClient = getPrismaUserClient((session.user as any).boutiqueId);

        // Transaction: Deduct Stock AND Create Debt Record
        const result = await userClient.$transaction(async (tx) => {
            // 1. Deduct Stock (Similar to sales)
            for (const item of items) {
                const produit = await tx.produit.findUnique({
                    where: { id: Number(item.produitId) }
                })

                if (!produit || produit.quantite < item.quantite) {
                    throw new Error(`Stock insuffisant pour: ${item.designation}`)
                }

                await tx.produit.update({
                    where: { id: Number(item.produitId) },
                    data: { quantite: produit.quantite - item.quantite }
                })
            }

            // 2. Create Debt Record
            const debt = await tx.dette.create({
                data: {
                    nomClient,
                    telephone,
                    montantTotal: totalAmount,
                    montantVerse: 0,
                    statut: "IMPAYE",
                    items: JSON.stringify(items), // Store snapshot of items
                    date: new Date()
                }
            })

            return debt
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[DEBTS_POST]", error)
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
