import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { supplierId, reference, dueDate, items, payImmediately = false } = body

        if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
            return new NextResponse("Paramètres obligatoires manquants", { status: 400 })
        }

        const userClient = getPrismaStoreClient((session.user as any).storeId)

        const result = await userClient.$transaction(async (tx) => {
            let totalHt = 0
            const invoiceItemsData = []

            for (const item of items) {
                const qty = Number(item.quantity)
                const price = Number(item.priceUnit)
                const disc = Number(item.discount || 0)
                const subtotal = qty * price * (1 - disc / 100)
                totalHt += subtotal

                invoiceItemsData.push({
                    productId: Number(item.productId),
                    quantity: qty,
                    priceUnit: price,
                    discount: disc,
                    subtotalHt: subtotal
                })
            }

            const tva = totalHt * 0.18 // 18% default TVA
            const totalTtc = totalHt + tva

            // 1. Create PurchaseInvoice
            const invoice = await tx.purchaseInvoice.create({
                data: {
                    supplierId: Number(supplierId),
                    reference: reference || null,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    status: payImmediately ? "PAYEE" : "BROUILLON",
                    totalHt,
                    totalTva: tva,
                    totalTtc,
                    items: {
                        create: invoiceItemsData
                    }
                }
            })

            // 2. If paid immediately, create CashMovement
            if (payImmediately) {
                await tx.cashMovement.create({
                    data: {
                        type: "SORTIE",
                        source: "ACHAT",
                        referenceId: invoice.id,
                        amount: totalTtc,
                        note: `Paiement facture d'achat fournisseur #${invoice.id} (Réf: ${reference || '-'})`,
                        moveDate: new Date()
                    }
                })
            }

            return invoice
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[PURCHASE_INVOICE_POST]", error)
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
