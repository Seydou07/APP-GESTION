import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
    if (session.user.role !== "ADMIN" && (session.user as any).role !== "STOCK_MANAGER") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const body = await req.json()
        const { productId, warehouseId, newQuantity, motif } = body

        if (productId === undefined || warehouseId === undefined || newQuantity === undefined || newQuantity < 0) {
            return new NextResponse("Paramètres invalides ou manquants", { status: 400 })
        }

        const userClient = getPrismaStoreClient(session.user.storeId)

        const result = await userClient.$transaction(async (tx) => {
            const stockLevel = await tx.stockLevel.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: Number(productId),
                        warehouseId: Number(warehouseId)
                    }
                }
            })

            const currentQty = stockLevel?.quantity || 0
            const difference = Number(newQuantity) - currentQty

            if (difference === 0) {
                return { success: true, message: "Aucune modification nécessaire" }
            }

            // Update or create stock level
            if (stockLevel) {
                await tx.stockLevel.update({
                    where: {
                        productId_warehouseId: {
                            productId: Number(productId),
                            warehouseId: Number(warehouseId)
                        }
                    },
                    data: { quantity: Number(newQuantity) }
                })
            } else {
                await tx.stockLevel.create({
                    data: {
                        productId: Number(productId),
                        warehouseId: Number(warehouseId),
                        quantity: Number(newQuantity)
                    }
                })
            }

            // Create StockMovement
            await tx.stockMovement.create({
                data: {
                    type: difference > 0 ? "ENTREE" : "SORTIE",
                    quantity: Math.abs(difference),
                    refType: "AJUSTEMENT",
                    productId: Number(productId),
                    warehouseId: Number(warehouseId),
                    note: motif || `Ajustement manuel de stock`
                }
            })

            // Log activity
            await tx.activityLog.create({
                data: {
                    action: "AJUSTEMENT",
                    tableName: "niveaux_stock",
                    recordId: Number(productId),
                    details: {
                        productId: Number(productId),
                        warehouseId: Number(warehouseId),
                        oldQuantity: currentQty,
                        newQuantity: Number(newQuantity),
                        difference,
                        motif: motif || ""
                    }
                }
            })

            return { success: true, oldQuantity: currentQty, newQuantity, difference }
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[STOCK_ADJUST_POST]", error)
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
