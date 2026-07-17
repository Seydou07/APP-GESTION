import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"

const catalogueSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
  categoryIds: z.array(z.number()).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const userClient = getPrismaStoreClient(session.user.storeId)
    const catalogues = await userClient.catalogue.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        catalogueCategories: {
          include: {
            category: {
              include: {
                products: {
                  include: {
                    stockLevels: true,
                  }
                }
              }
            }
          },
          orderBy: { order: "asc" }
        },
        _count: {
          select: { catalogueCategories: true }
        }
      },
    })
    return NextResponse.json(catalogues)
  } catch (error) {
    console.error("[CATALOGUES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
  if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

  try {
    const body = await req.json()
    const parsed = catalogueSchema.parse(body)
    const userClient = getPrismaStoreClient(session.user.storeId)

    const catalogue = await userClient.$transaction(async (tx) => {
      const created = await tx.catalogue.create({
        data: {
          name: parsed.name,
          description: parsed.description ?? null,
          image: parsed.image ?? null,
        },
      })

      if (parsed.categoryIds && parsed.categoryIds.length > 0) {
        await tx.catalogueCategory.createMany({
          data: parsed.categoryIds.map((categoryId, index) => ({
            catalogueId: created.id,
            categoryId,
            order: index,
          })),
        })
      }

      return created
    })

    return NextResponse.json(catalogue)
  } catch (error: any) {
    console.error("[CATALOGUES_POST]", error)
    if (error.issues) return NextResponse.json({ error: error.issues }, { status: 400 })
    return new NextResponse(error.message || "Internal Error", { status: 500 })
  }
}
