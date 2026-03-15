import { getPrismaUserClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaUserClient(session.user.boutiqueId)
        const sales = await userClient.ventePersistante.findMany({
            orderBy: {
                date: "desc"
            },
            take: 50 // Limit to last 50 for performance
        })
        return NextResponse.json(sales)
    } catch (error) {
        console.error("[SALES_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { items, nomClient, prenomClient, numeroClient, remise = 0, commission = 0 } = body

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("Le panier est vide")
        }

        // Transaction to update stock and save sales
        const transactionId = `TRX-${crypto.randomUUID().substring(0, 8).toUpperCase()}`
        const userClient = getPrismaUserClient(session.user.boutiqueId)

        const result = await userClient.$transaction(async (tx: any) => {
            const salesResults = []

            for (const item of items) {
                const { produitId, quantite } = item

                const produit = await tx.produit.findUnique({
                    where: { id: Number(produitId) },
                })

                if (!produit || produit.quantite < quantite) {
                    throw new Error(`Stock insuffisant pour le produit: ${produit?.designation || produitId}`)
                }

                const total = produit.prixUnitaire * quantite

                // Create temporary sale
                const vente = await tx.vente.create({
                    data: {
                        produitId: Number(produitId),
                        designation: produit.designation,
                        prixUnitaire: produit.prixUnitaire,
                        quantite,
                        total,
                        nomClient,
                        prenomClient,
                        numeroClient,
                        transactionId,
                    },
                })

                // Create persistent sale history
                await tx.ventePersistante.create({
                    data: {
                        produitId: Number(produitId),
                        designation: produit.designation,
                        prixUnitaire: produit.prixUnitaire,
                        quantite,
                        total,
                        nomClient,
                        prenomClient,
                        numeroClient,
                        transactionId,
                        remise,
                        commission,
                    },
                })

                // Update product stock
                await tx.produit.update({
                    where: { id: Number(produitId) },
                    data: {
                        quantite: produit.quantite - quantite,
                    },
                })

                salesResults.push(vente)
            }

            // If commission > 0, create expense
            if (commission > 0) {
                await tx.depense.create({
                    data: {
                        libelle: `Commission sur vente ${transactionId}`,
                        montant: commission,
                        categorie: "COMMISSION",
                        date: new Date(),
                        notes: `Génération automatique pour transaction ${transactionId}`
                    }
                })
            }

            return salesResults
        })

        return NextResponse.json(result)
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 400 })
    }
}
