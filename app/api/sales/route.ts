import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const sales = await (prisma as any).ventePersistante.findMany({
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
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { produitId, quantite, nomClient, prenomClient, numeroClient } = body

        // Transaction to update stock and save sale
        const result = await prisma.$transaction(async (tx) => {
            const produit = await tx.produit.findUnique({
                where: { id: produitId },
            })

            if (!produit || produit.quantite < quantite) {
                throw new Error("Stock insuffisant")
            }

            const total = produit.prixUnitaire * quantite

            // Create temporary sale
            const vente = await tx.vente.create({
                data: {
                    produitId,
                    designation: produit.designation,
                    prixUnitaire: produit.prixUnitaire,
                    quantite,
                    total,
                    nomClient,
                    prenomClient,
                    numeroClient,
                },
            })

            // Create persistent sale history
            await tx.ventePersistante.create({
                data: {
                    produitId,
                    designation: produit.designation,
                    prixUnitaire: produit.prixUnitaire,
                    quantite,
                    total,
                    nomClient,
                    prenomClient,
                    numeroClient,
                },
            })

            // Update product stock
            await tx.produit.update({
                where: { id: produitId },
                data: {
                    quantite: produit.quantite - quantite,
                },
            })

            return vente
        })

        return NextResponse.json(result)
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 400 })
    }
}
