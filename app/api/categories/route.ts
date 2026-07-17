import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
    try {
        const session = await auth()
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const userClient = getPrismaStoreClient(session.user.storeId)
        const categories = await userClient.category.findMany({
            orderBy: { name: "asc" },
        })

        const transformed = categories.map(c => ({
            id: c.id,
            nom: c.name,
            image: c.image || "",
            keywords: [] as string[],
            description: c.description || "",
            _count: { products: 0 },
        }))

        return NextResponse.json(transformed)
    } catch (error) {
        console.error("[CATEGORIES_GET]", error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const userClient = getPrismaStoreClient(session.user.storeId)
        const category = await userClient.category.create({
            data: {
                name: body.name || body.nom,
                description: body.description || null,
                image: body.image || null,
            }
        })
        return NextResponse.json({
            id: category.id,
            nom: category.name,
            image: category.image || "",
            keywords: [],
            description: category.description || "",
        })
    } catch (error: any) {
        console.error("[CATEGORIES_POST]", error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const { id, ...data } = body
        if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 })

        const userClient = getPrismaStoreClient(session.user.storeId)
        const category = await userClient.category.update({
            where: { id: Number(id) },
            data: {
                name: data.name || data.nom,
                description: data.description || null,
                image: data.image || null,
            }
        })
        return NextResponse.json({
            id: category.id,
            nom: category.name,
            image: category.image || "",
            keywords: [],
            description: category.description || "",
        })
    } catch (error: any) {
        console.error("[CATEGORIES_PUT]", error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const { id } = body
        if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 })

        const userClient = getPrismaStoreClient(session.user.storeId)
        await userClient.category.delete({ where: { id: Number(id) } })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("[CATEGORIES_DELETE]", error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}
