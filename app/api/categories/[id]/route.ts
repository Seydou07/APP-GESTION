import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient(session.user.storeId)
        const category = await userClient.category.findUnique({
            where: { id: Number(id) },
            include: {
                _count: { select: { products: true } },
                products: {
                    include: {
                        stockLevels: true,
                    }
                }
            }
        })

        if (!category) {
            return new NextResponse("Not Found", { status: 404 })
        }

        return NextResponse.json(category)
    } catch (error) {
        console.error("[CATEGORY_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
