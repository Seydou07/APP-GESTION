import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const WAREHOUSE_MAGASIN = 2
const WAREHOUSE_BOUTIQUE = 1

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const produitId = body.produitId ?? body.productId
        const quantite = body.quantite ?? body.quantity

        if (!produitId || !quantite || quantite <= 0) {
            return new NextResponse("Paramètres invalides", { status: 400 })
        }

        const userClient = getPrismaStoreClient(session.user.storeId)

        const result = await userClient.$transaction(async (tx) => {
            // Check magasin stock
            const magasinStock = await tx.stockLevel.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: Number(produitId),
                        warehouseId: WAREHOUSE_MAGASIN
                    }
                }
            })

            if (!magasinStock || magasinStock.quantity < quantite) {
                throw new Error("Stock insuffisant au magasin")
            }

            // Decrease magasin
            await tx.stockLevel.update({
                where: {
                    productId_warehouseId: {
                        productId: Number(produitId),
                        warehouseId: WAREHOUSE_MAGASIN
                    }
                },
                data: { quantity: magasinStock.quantity - quantite }
            })

            // Increase boutique
            const boutiqueStock = await tx.stockLevel.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: Number(produitId),
                        warehouseId: WAREHOUSE_BOUTIQUE
                    }
                }
            })

            if (boutiqueStock) {
                await tx.stockLevel.update({
                    where: {
                        productId_warehouseId: {
                            productId: Number(produitId),
                            warehouseId: WAREHOUSE_BOUTIQUE
                        }
                    },
                    data: { quantity: boutiqueStock.quantity + quantite }
                })
            } else {
                await tx.stockLevel.create({
                    data: {
                        productId: Number(produitId),
                        warehouseId: WAREHOUSE_BOUTIQUE,
                        quantity: quantite
                    }
                })
            }

            // Log movements
            // 1. Sortie Magasin
            await tx.stockMovement.create({
                data: {
                    type: "SORTIE",
                    quantity: quantite,
                    refType: "TRANSFERT",
                    productId: Number(produitId),
                    warehouseId: WAREHOUSE_MAGASIN,
                    note: "Transfert vers Boutique"
                }
            })

            // 2. Entree Boutique
            await tx.stockMovement.create({
                data: {
                    type: "ENTREE",
                    quantity: quantite,
                    refType: "TRANSFERT",
                    productId: Number(produitId),
                    warehouseId: WAREHOUSE_BOUTIQUE,
                    note: "Transfert depuis Magasin"
                }
            })

            return { success: true, quantite }
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[TRANSFER_POST]", error)
        return new NextResponse(error.message || "Internal Error", { status: 400 })
    }
}
