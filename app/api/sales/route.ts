import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient(session.user.storeId)
        const sales = await userClient.sale.findMany({
            orderBy: { saleDate: "desc" },
            take: 50,
            include: { items: { include: { product: { select: { name: true, code: true } } } }, client: { select: { name: true, phone: true } } }
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
        const { items, nomClient, prenomClient, numeroClient, remise = 0, commission = 0, paymentMethod, clientId, paidAmount } = body

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("Le panier est vide")
        }

        const transactionId = `TRX-${crypto.randomUUID().substring(0, 8).toUpperCase()}`
        const userClient = getPrismaStoreClient(session.user.storeId)
        const WAREHOUSE_BOUTIQUE = 1

        const result = await userClient.$transaction(async (tx) => {
            let totalTtc = 0
            const saleItemsData: any[] = []

            for (const item of items) {
                const productId = item.productId ?? item.produitId
                const quantity = item.quantity ?? item.quantite

                if (!productId || !quantity) continue

                const product = await tx.product.findUnique({
                    where: { id: Number(productId) },
                })

                if (!product) throw new Error(`Produit non trouvé: ${productId}`)

                const stockLevel = await tx.stockLevel.findUnique({
                    where: {
                        productId_warehouseId: {
                            productId: Number(productId),
                            warehouseId: WAREHOUSE_BOUTIQUE
                        }
                    }
                })

                const availableQuantity = stockLevel?.quantity || 0
                if (availableQuantity < quantity) {
                    throw new Error(`Stock insuffisant pour "${product.name}" (dispo: ${availableQuantity}, demandé: ${quantity})`)
                }

                const priceUnit = item.priceUnit || product.salePrice
                const discount = item.discount || 0
                const subtotal = (priceUnit * quantity) - discount
                totalTtc += subtotal

                saleItemsData.push({
                    designation: item.designation || product.name,
                    quantity,
                    priceUnit,
                    costPrice: product.costPrice,
                    discount,
                    subtotal,
                    productId: Number(productId),
                })

                await tx.stockLevel.update({
                    where: {
                        productId_warehouseId: {
                            productId: Number(productId),
                            warehouseId: WAREHOUSE_BOUTIQUE
                        }
                    },
                    data: { quantity: availableQuantity - quantity }
                })

                await tx.stockMovement.create({
                    data: {
                        type: "SORTIE",
                        quantity,
                        refType: "VENTE",
                        productId: Number(productId),
                        warehouseId: WAREHOUSE_BOUTIQUE,
                    }
                })
            }

            const totalRemise = Number(remise) || 0
            const totalAfterDiscount = Math.max(0, totalTtc - totalRemise)
            const totalCommission = Number(commission) || 0

            const actualPaidAmount = paidAmount !== undefined ? Math.min(Number(paidAmount), totalAfterDiscount) : totalAfterDiscount

            let saleStatus: any = "PAYEE"
            if (actualPaidAmount === 0) {
                saleStatus = "DETTE"
            } else if (actualPaidAmount < totalAfterDiscount) {
                saleStatus = "PARTIELLE"
            }

            const sale = await tx.sale.create({
                data: {
                    totalHt: totalTtc,
                    totalTtc: totalAfterDiscount,
                    paidAmount: actualPaidAmount,
                    discount: totalRemise,
                    commission: totalCommission,
                    status: saleStatus,
                    paymentMethod: paymentMethod || null,
                    transactionId,
                    userId: Number(session.user.id),
                    clientId: clientId ? Number(clientId) : null,
                    items: {
                        create: saleItemsData
                    }
                },
                include: { items: true }
            })

            // 1. Log Cash Movement if there is any cash received
            if (actualPaidAmount > 0) {
                await tx.cashMovement.create({
                    data: {
                        type: "ENTREE",
                        source: "VENTE",
                        referenceId: sale.id,
                        amount: actualPaidAmount,
                        note: `Encaissement vente #${sale.id} (Réf: ${transactionId}) - Moyen: ${paymentMethod || "ESPECES"}`,
                        userId: Number(session.user.id),
                        moveDate: new Date()
                    }
                })
            }

            // 2. Log Customer Debt if it's a credit or partial sale
            if ((saleStatus === "DETTE" || saleStatus === "PARTIELLE") && clientId) {
                const debtAmount = totalAfterDiscount - actualPaidAmount
                const defaultDueDate = new Date()
                defaultDueDate.setDate(defaultDueDate.getDate() + 30) // Default 30 days echeance

                await tx.customerDebt.create({
                    data: {
                        clientId: Number(clientId),
                        saleId: sale.id,
                        amountInitial: debtAmount,
                        amountDue: debtAmount,
                        dueDate: defaultDueDate,
                        status: "EN_COURS",
                        notes: `Reste à payer sur vente #${sale.id} (Réf: ${transactionId})`
                    }
                })
            }

            // 3. Generate Invoice Document
            const currentYear = new Date().getFullYear()
            const invoiceCount = await tx.invoice.count({
                where: {
                    invoiceDate: {
                        gte: new Date(currentYear, 0, 1),
                        lt: new Date(currentYear + 1, 0, 1)
                    }
                }
            })
            const invoiceNumber = `FAC-${currentYear}-${String(invoiceCount + 1).padStart(4, '0')}`

            // 18% standard VAT calculation
            const htPrice = totalAfterDiscount / 1.18
            const tvaPrice = totalAfterDiscount - htPrice

            await tx.invoice.create({
                data: {
                    invoiceNumber,
                    invoiceDate: new Date(),
                    dueDate: new Date(),
                    status: actualPaidAmount >= totalAfterDiscount ? "PAYEE" : "BROUILLON",
                    totalHt: htPrice,
                    totalTva: tvaPrice,
                    totalTtc: totalAfterDiscount,
                    saleId: sale.id,
                    clientId: clientId ? Number(clientId) : null
                }
            })

            // 4. Generate Ticket
            const ticketCount = await tx.ticket.count({
                where: {
                    printDate: {
                        gte: new Date(currentYear, 0, 1),
                        lt: new Date(currentYear + 1, 0, 1)
                    }
                }
            })
            const ticketNumber = `TKT-${currentYear}-${String(ticketCount + 1).padStart(4, '0')}`

            await tx.ticket.create({
                data: {
                    ticketNumber,
                    printDate: new Date(),
                    saleId: sale.id
                }
            })

            // 4. Handle Commission Expense if any
            if (totalCommission > 0) {
                const existingCategory = await tx.expenseCategory.findFirst({
                    where: { name: "COMMISSION" }
                })
                const categoryId = existingCategory?.id || (
                    await tx.expenseCategory.create({ data: { name: "COMMISSION" } })
                ).id

                await tx.expense.create({
                    data: {
                        amount: totalCommission,
                        description: `Commission sur vente ${transactionId}`,
                        categoryId,
                        notes: `Vente #${sale.id}`
                    }
                })
            }

            return sale
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[SALES_POST]", error)
        return new NextResponse(error.message || "Internal Error", { status: 400 })
    }
}
