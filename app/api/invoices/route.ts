import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient(session.user.storeId)
        const invoices = await userClient.invoice.findMany({
            include: {
                client: { select: { id: true, name: true, phone: true, email: true, address: true } },
                sale: { include: { items: { include: { product: true } } } }
            },
            orderBy: { invoiceDate: "desc" }
        })

        return NextResponse.json(invoices)
    } catch (error) {
        console.error("[INVOICES_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
