import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient(session.user.storeId)
        const debts = await userClient.customerDebt.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                client: { select: { name: true, phone: true } },
                payments: { orderBy: { paymentDate: "desc" } }
            }
        })
        return NextResponse.json(debts)
    } catch (error) {
        console.error("[DEBTS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { items, clientId, total, notes } = body

        if (!items || !items.length || !clientId) {
            return new NextResponse("Champs requis manquants", { status: 400 })
        }

        const userClient = getPrismaStoreClient(session.user.storeId)

        const debt = await userClient.$transaction(async (tx) => {
            // Create the debt
            const created = await tx.customerDebt.create({
                data: {
                    clientId: Number(clientId),
                    amountInitial: Number(total) || 0,
                    amountDue: Number(total) || 0,
                    notes: notes || null,
                    status: "EN_COURS",
                }
            })

            // Decrement stock for each item
            for (const item of items) {
                const productId = item.productId ?? item.produitId
                const quantity = item.quantity ?? item.quantite
                if (!productId || !quantity) continue

                const stockLevel = await tx.stockLevel.findUnique({
                    where: {
                        productId_warehouseId: {
                            productId: Number(productId),
                            warehouseId: 1
                        }
                    }
                })

                if (stockLevel && stockLevel.quantity >= quantity) {
                    await tx.stockLevel.update({
                        where: {
                            productId_warehouseId: {
                                productId: Number(productId),
                                warehouseId: 1
                            }
                        },
                        data: { quantity: stockLevel.quantity - quantity }
                    })

                    await tx.stockMovement.create({
                        data: {
                            type: "SORTIE",
                            quantity,
                            refType: "CREDIT",
                            productId: Number(productId),
                            warehouseId: 1,
                        }
                    })
                }
            }

            return created
        })

        return NextResponse.json(debt)
    } catch (error) {
        console.error("[DEBTS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

