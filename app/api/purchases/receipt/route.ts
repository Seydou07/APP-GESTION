import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { orderId, items, warehouseId = 2, notes } = body // Default to warehouse 2 (Magasin)

        if (!items || !Array.isArray(items) || items.length === 0) {
            return new NextResponse("Articles requis pour la réception", { status: 400 })
        }

        const userClient = getPrismaStoreClient((session.user as any).storeId)

        const result = await userClient.$transaction(async (tx) => {
            // 1. Create PurchaseReceipt
            const receipt = await tx.purchaseReceipt.create({
                data: {
                    orderId: orderId ? Number(orderId) : null,
                    notes: notes || null,
                    status: "COMPLETE",
                    total: items.reduce((sum, item) => sum + (item.quantity * item.priceUnit), 0),
                    receiptDate: new Date()
                }
            })

            for (const item of items) {
                const productId = Number(item.productId)
                const quantity = Number(item.quantity)
                const priceUnit = Number(item.priceUnit)

                // 2. Create PurchaseReceiptItem
                await tx.purchaseReceiptItem.create({
                    data: {
                        receiptId: receipt.id,
                        productId,
                        quantity,
                        priceUnit
                    }
                })

                // 3. CMUP Calculation
                const product = await tx.product.findUnique({
                    where: { id: productId },
                    include: { stockLevels: true }
                })

                if (product) {
                    const qOld = product.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0)
                    const pOld = product.costPrice
                    const qNew = quantity
                    const pNew = priceUnit

                    let newCostPrice = pNew
                    if (qOld + qNew > 0) {
                        newCostPrice = ((qOld * pOld) + (qNew * pNew)) / (qOld + qNew)
                    }

                    // Update product cost price
                    await tx.product.update({
                        where: { id: productId },
                        data: { costPrice: newCostPrice }
                    })
                }

                // 4. Update Stock Levels (increase)
                const stockLevel = await tx.stockLevel.findUnique({
                    where: {
                        productId_warehouseId: {
                            productId,
                            warehouseId: Number(warehouseId)
                        }
                    }
                })

                if (stockLevel) {
                    await tx.stockLevel.update({
                        where: {
                            productId_warehouseId: {
                                productId,
                                warehouseId: Number(warehouseId)
                            }
                        },
                        data: { quantity: stockLevel.quantity + quantity }
                    })
                } else {
                    await tx.stockLevel.create({
                        data: {
                            productId,
                            warehouseId: Number(warehouseId),
                            quantity
                        }
                    })
                }

                // 5. Create StockMovement
                await tx.stockMovement.create({
                    data: {
                        type: "ENTREE",
                        quantity,
                        refType: "ACHAT",
                        refId: receipt.id,
                        productId,
                        warehouseId: Number(warehouseId),
                        note: notes || `Réception d'achat #${receipt.id}`
                    }
                })
            }

            // 6. Update PurchaseOrder status if linked
            if (orderId) {
                await tx.purchaseOrder.update({
                    where: { id: Number(orderId) },
                    data: { status: "RECU" }
                })
            }

            return receipt
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[PURCHASE_RECEIPT_POST]", error)
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
