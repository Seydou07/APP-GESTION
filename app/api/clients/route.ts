import { auth } from "@/lib/auth"
import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient((session.user as any).storeId)
        const clients = await userClient.client.findMany({
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { sales: true, customerDebts: true } } }
        })
        return NextResponse.json(clients)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { name, phone, email, address, creditLimit } = body

        if (!name) {
            return new NextResponse("Le nom est obligatoire", { status: 400 })
        }

        const userClient = getPrismaStoreClient((session.user as any).storeId)
        const client = await userClient.client.create({
            data: { name, phone, email, address, creditLimit: creditLimit || 0 }
        })

        return NextResponse.json(client)
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { id, name, phone, email, address, creditLimit } = body

        if (!id) return new NextResponse("ID manquant", { status: 400 })

        const userClient = getPrismaStoreClient((session.user as any).storeId)
        const client = await userClient.client.update({
            where: { id },
            data: { name, phone, email, address, creditLimit }
        })

        return NextResponse.json(client)
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
        await userClient.client.delete({ where: { id } })

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
