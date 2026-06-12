import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { categorySchema } from "@/lib/validations"

export async function GET() {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient(session.user.storeId)
        const categories = await userClient.category.findMany({
            orderBy: { name: "asc" },
            include: { _count: { select: { products: true } } }
        })
        return NextResponse.json(categories)
    } catch (error) {
        console.error("[CATEGORIES_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
    if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

    try {
        const body = await req.json()
        const parsed = categorySchema.parse(body)
        const userClient = getPrismaStoreClient(session.user.storeId)

        const category = await userClient.category.create({
            data: {
                name: parsed.name,
                description: parsed.description || null,
                parentId: parsed.parentId || null,
            }
        })

        return NextResponse.json(category)
    } catch (error: any) {
        console.error("[CATEGORIES_POST]", error)
        if (error.issues) return NextResponse.json({ error: error.issues }, { status: 400 })
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}

export async function PUT(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
    if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

    try {
        const body = await req.json()
        const { id, ...data } = body
        if (!id) return new NextResponse("ID manquant", { status: 400 })

        const userClient = getPrismaStoreClient(session.user.storeId)
        const category = await userClient.category.update({
            where: { id: Number(id) },
            data,
        })

        return NextResponse.json(category)
    } catch (error: any) {
        console.error("[CATEGORIES_PUT]", error)
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
        if (!id) return new NextResponse("ID manquant", { status: 400 })

        const userClient = getPrismaStoreClient(session.user.storeId)
        await userClient.category.delete({ where: { id: Number(id) } })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[CATEGORIES_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
