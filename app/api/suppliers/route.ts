import { auth } from "@/lib/auth"
import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient((session.user as any).storeId)
        const suppliers = await userClient.supplier.findMany({
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { purchaseOrders: true, purchaseInvoices: true } } }
        })
        return NextResponse.json(suppliers)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { name, phone, email, address, notes } = body

        if (!name) {
            return new NextResponse("Le nom est obligatoire", { status: 400 })
        }

        const userClient = getPrismaStoreClient((session.user as any).storeId)
        const supplier = await userClient.supplier.create({
            data: { name, phone, email, address, notes }
        })

        return NextResponse.json(supplier)
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { id, name, phone, email, address, notes } = body

        if (!id) return new NextResponse("ID manquant", { status: 400 })

        const userClient = getPrismaStoreClient((session.user as any).storeId)
        const supplier = await userClient.supplier.update({
            where: { id },
            data: { name, phone, email, address, notes }
        })

        return NextResponse.json(supplier)
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { id } = body

        if (!id) return new NextResponse("ID manquant", { status: 400 })

        const userClient = getPrismaStoreClient((session.user as any).storeId)
        await userClient.supplier.delete({ where: { id } })

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
