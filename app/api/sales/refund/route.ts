import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { saleId, items, motif } = body // items: [{ productId, quantity }]

        if (!saleId || !items || !Array.isArray(items) || items.length === 0) {
            return new NextResponse("Paramètres requis manquants", { status: 400 })
        }

        const userClient = getPrismaStoreClient((session.user as any).storeId)
        const WAREHOUSE_BOUTIQUE = 1

        const result = await userClient.$transaction(async (tx) => {
            // 1. Fetch original sale
            const sale = await tx.sale.findUnique({
                where: { id: Number(saleId) },
                include: { items: true, client: true }
            })

            if (!sale) throw new Error("Vente introuvable")

            let refundTtc = 0

            for (const item of items) {
                const productId = Number(item.productId)
                const qtyReturned = Number(item.quantity)

                const soldItem = sale.items.find(si => si.productId === productId)
                if (!soldItem) throw new Error(`Le produit #${productId} ne fait pas partie de cette vente`)
                if (qtyReturned > soldItem.quantity) {
                    throw new Error(`La quantité retournée (${qtyReturned}) dépasse la quantité vendue (${soldItem.quantity})`)
                }

                const priceUnit = soldItem.priceUnit
                const discProportion = soldItem.discount / soldItem.quantity
                const itemRefundAmount = (priceUnit * qtyReturned) - (discProportion * qtyReturned)
                refundTtc += itemRefundAmount

                // 2. Increment stock boutique
                const stockLevel = await tx.stockLevel.findUnique({
                    where: {
                        productId_warehouseId: {
                            productId,
                            warehouseId: WAREHOUSE_BOUTIQUE
                        }
                    }
                })

                if (stockLevel) {
                    await tx.stockLevel.update({
                        where: {
                            productId_warehouseId: {
                                productId,
                                warehouseId: WAREHOUSE_BOUTIQUE
                            }
                        },
                        data: { quantity: stockLevel.quantity + qtyReturned }
                    })
                } else {
                    await tx.stockLevel.create({
                        data: {
                            productId,
                            warehouseId: WAREHOUSE_BOUTIQUE,
                            quantity: qtyReturned
                        }
                    })
                }

                // 3. Log stock movement
                await tx.stockMovement.create({
                    data: {
                        type: "ENTREE",
                        quantity: qtyReturned,
                        refType: "RETOUR",
                        refId: sale.id,
                        productId,
                        warehouseId: WAREHOUSE_BOUTIQUE,
                        note: motif || `Retour client pour vente #${sale.id}`
                    }
                })
            }

            // 4. Create Cash Outflow (SORTIE) for refund
            await tx.cashMovement.create({
                data: {
                    type: "SORTIE",
                    source: "VENTE",
                    referenceId: sale.id,
                    amount: refundTtc,
                    note: `Remboursement retour articles sur vente #${sale.id} (Réf: ${sale.transactionId})`,
                    userId: Number(session.user.id),
                    moveDate: new Date()
                }
            })

            // 5. Generate Credit Note (Avoir)
            const currentYear = new Date().getFullYear()
            const creditNoteCount = await tx.invoice.count({
                where: {
                    invoiceNumber: { startsWith: `AVR-${currentYear}` }
                }
            })
            const creditNoteNumber = `AVR-${currentYear}-${String(creditNoteCount + 1).padStart(4, '0')}`

            const refundHt = refundTtc / 1.18
            const refundTva = refundTtc - refundHt

            const creditNote = await tx.invoice.create({
                data: {
                    invoiceNumber: creditNoteNumber,
                    invoiceDate: new Date(),
                    dueDate: new Date(),
                    status: "PAYEE", // The credit was refunded
                    totalHt: -refundHt,
                    totalTva: -refundTva,
                    totalTtc: -refundTtc,
                    saleId: sale.id,
                    clientId: sale.clientId,
                    notes: `Avoir généré pour retour sur facture initiale de vente #${sale.id}. Motif: ${motif || "Non spécifié"}`
                }
            })

            // 6. Log Activity
            await tx.activityLog.create({
                data: {
                    action: "REMBOURSEMENT",
                    tableName: "ventes",
                    recordId: sale.id,
                    details: {
                        saleId: sale.id,
                        transactionId: sale.transactionId,
                        itemsReturned: items,
                        refundAmount: refundTtc,
                        creditNoteNumber,
                        motif: motif || ""
                    }
                }
            })

            // 7. Update original sale status if fully returned
            // (Check if total items returned equals total items sold)
            // We can implement a check if needed, but simple refund logging is sufficient.

            return {
                success: true,
                refundAmount: refundTtc,
                creditNoteNumber
            }
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[SALES_REFUND_POST]", error)
        return new NextResponse(error.message || "Internal Error", { status: 400 })
    }
}
