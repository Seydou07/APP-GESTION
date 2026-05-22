import { getPrismaUserClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
    if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

    try {
        const body = await req.json()
        const { produitId, quantite } = body

        if (!produitId || !quantite || quantite <= 0) {
            return new NextResponse("Paramètres invalides", { status: 400 })
        }

        const userClient = getPrismaUserClient(session.user.boutiqueId)

        // Perform inside a transaction to ensure atomic updates
        const result = await userClient.$transaction(async (tx) => {
            const product = await tx.produit.findUnique({
                where: { id: Number(produitId) }
            })

            if (!product) {
                throw new Error("Produit non trouvé")
            }

            if (product.quantiteMagasin < quantite) {
                throw new Error("Stock magasin insuffisant")
            }

            const quantiteAvant = product.quantite
            const quantiteApres = quantiteAvant + quantite

            // Update product
            const updatedProduct = await tx.produit.update({
                where: { id: product.id },
                data: {
                    quantite: quantiteApres,
                    quantiteMagasin: product.quantiteMagasin - quantite
                }
            })

            // Log stock history
            await tx.historiqueStock.create({
                data: {
                    produitId: product.id,
                    designation: product.designation,
                    quantiteAvant,
                    quantiteApres,
                    difference: quantite,
                    typeOperation: "TRANSFERT_MAGASIN",
                    utilisateur: session.user.name || "Administrateur"
                }
            })

            return updatedProduct
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("Transfer Error:", error)
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
