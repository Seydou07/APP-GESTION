import { getPrismaUserClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaUserClient(session.user.boutiqueId)
        const products = await userClient.produit.findMany({
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(products)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
    if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

    try {
        const body = await req.json()
        const userClient = getPrismaUserClient(session.user.boutiqueId)
        const product = await userClient.produit.create({
            data: body,
        })
        return NextResponse.json(product)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
    if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

    try {
        const body = await req.json()
        const { id, ...data } = body

        if (!id) {
            return new NextResponse("ID manquant", { status: 400 })
        }

        const userClient = getPrismaUserClient(session.user.boutiqueId)
        const product = await userClient.produit.update({
            where: { id: Number(id) },
            data,
        })
        return NextResponse.json(product)
    } catch (error) {
        console.error("Product Update Error:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
    if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

    try {
        const body = await req.json()
        const { id } = body

        if (!id) {
            return new NextResponse("ID manquant", { status: 400 })
        }

        const userClient = getPrismaUserClient(session.user.boutiqueId)
        await userClient.produit.delete({
            where: { id: Number(id) },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("Product Delete Error:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
