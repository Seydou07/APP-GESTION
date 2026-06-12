import { auth } from "@/lib/auth"
import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient((session.user as any).storeId)
        const orders = await userClient.purchaseOrder.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                supplier: true,
                items: { include: { product: true } },
                receipts: true,
            }
        })
        return NextResponse.json(orders)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { supplierId, items, notes } = body

        if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
            return new NextResponse("Fournisseur et articles obligatoires", { status: 400 })
        }

        const userClient = getPrismaStoreClient((session.user as any).storeId)
        const totalHt = items.reduce((sum: number, item: any) => {
            return sum + (item.quantity * item.priceUnit * (1 - (item.discount || 0) / 100))
        }, 0)

        const order = await userClient.purchaseOrder.create({
            data: {
                supplierId,
                totalHt,
                notes,
                status: "COMMANDE",
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        priceUnit: item.priceUnit,
                        discount: item.discount || 0,
                        subtotal: item.quantity * item.priceUnit * (1 - (item.discount || 0) / 100),
                    }))
                }
            },
            include: {
                supplier: true,
                items: { include: { product: true } },
            }
        })

        return NextResponse.json(order)
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
