import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const products = await prisma.produit.findMany({
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(products)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const product = await prisma.produit.create({
            data: body,
        })
        return NextResponse.json(product)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}
