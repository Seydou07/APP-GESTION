import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { productSchema } from "@/lib/validations"

export async function GET() {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const userClient = getPrismaStoreClient(session.user.storeId)
        const products = await userClient.product.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                category: true,
                stockLevels: true,
            },
        })
        // Transform products to match user's interface (designation, quantite, prixUnitaire, etc.)
        const transformedProducts = products.map(prod => ({
            ...prod,
            designation: prod.name,
            prixUnitaire: prod.salePrice,
            quantite: prod.stockLevels?.find((sl: any) => sl.warehouseId === 1)?.quantity ?? 0,
            quantiteMagasin: prod.stockLevels?.find((sl: any) => sl.warehouseId === 2)?.quantity ?? 0,
            category: prod.category ? {
                ...prod.category,
                nom: prod.category.name,
            } : null,
            categorie: prod.category ? {
                ...prod.category,
                nom: prod.category.name,
            } : null,
        }))
        return NextResponse.json(transformedProducts)
    } catch (error) {
        console.error("[PRODUCTS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
    if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

    try {
        const body = await req.json()
        const { stockQuantity, ...productData } = body

        const parsed = productSchema.parse(productData)
        const userClient = getPrismaStoreClient(session.user.storeId)

        const product = await userClient.$transaction(async (tx) => {
            const created = await tx.product.create({
                data: {
                    code: parsed.code,
                    name: parsed.name,
                    salePrice: parsed.salePrice,
                    costPrice: parsed.costPrice ?? 0,
                    unit: parsed.unit ?? "pièce",
                    stockMin: parsed.stockMin ?? 5,
                    description: parsed.description ?? null,
                    categoryId: parsed.categoryId ?? null,
                },
            })

            const qty = Math.max(0, Number(stockQuantity) || 0)
            if (qty > 0) {
                await tx.stockLevel.create({
                    data: {
                        productId: created.id,
                        warehouseId: 1,
                        quantity: qty,
                    }
                })
                await tx.stockMovement.create({
                    data: {
                        type: "ENTREE",
                        quantity: qty,
                        refType: "INITIAL",
                        productId: created.id,
                        warehouseId: 1,
                    }
                })
            } else {
                await tx.stockLevel.create({
                    data: {
                        productId: created.id,
                        warehouseId: 1,
                        quantity: 0,
                    }
                })
            }

            await tx.stockLevel.create({
                data: {
                    productId: created.id,
                    warehouseId: 2,
                    quantity: 0,
                }
            })

            return created
        })

        return NextResponse.json(product)
    } catch (error: any) {
        console.error("[PRODUCTS_POST]", error)
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

        if (!id) {
            return new NextResponse("ID manquant", { status: 400 })
        }

        const parsed = productSchema.partial().parse(data)
        const userClient = getPrismaStoreClient(session.user.storeId)

        const product = await userClient.product.update({
            where: { id: Number(id) },
            data: {
                ...parsed,
                categoryId: parsed.categoryId ?? null,
            },
        })

        return NextResponse.json(product)
    } catch (error: any) {
        console.error("[PRODUCTS_PUT]", error)
        if (error.issues) return NextResponse.json({ error: error.issues }, { status: 400 })
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

        const userClient = getPrismaStoreClient(session.user.storeId)
        await userClient.product.delete({
            where: { id: Number(id) },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[PRODUCTS_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
