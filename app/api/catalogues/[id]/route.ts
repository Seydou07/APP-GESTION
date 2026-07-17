import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"

const catalogueUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  categoryIds: z.array(z.number()).optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const userClient = getPrismaStoreClient(session.user.storeId)
    const catalogue = await userClient.catalogue.findUnique({
      where: { id: Number(id) },
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
      },
    })

    if (!catalogue) {
      return new NextResponse("Catalogue not found", { status: 404 })
    }

    return NextResponse.json(catalogue)
  } catch (error) {
    console.error("[CATALOGUE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
  if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

  try {
    const body = await req.json()
    const parsed = catalogueUpdateSchema.parse(body)
    const userClient = getPrismaStoreClient(session.user.storeId)

    const catalogue = await userClient.$transaction(async (tx) => {
      const { categoryIds, ...updateData } = parsed

      const updated = await tx.catalogue.update({
        where: { id: Number(id) },
        data: updateData,
      })

      if (categoryIds !== undefined) {
        // Delete existing categories
        await tx.catalogueCategory.deleteMany({
          where: { catalogueId: Number(id) },
        })

        // Add new categories
        if (categoryIds.length > 0) {
          await tx.catalogueCategory.createMany({
            data: categoryIds.map((categoryId, index) => ({
              catalogueId: Number(id),
              categoryId,
              order: index,
            })),
          })
        }
      }

      return updated
    })

    return NextResponse.json(catalogue)
  } catch (error: any) {
    console.error("[CATALOGUE_PUT]", error)
    if (error.issues) return NextResponse.json({ error: error.issues }, { status: 400 })
    return new NextResponse(error.message || "Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })
  if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

  try {
    const userClient = getPrismaStoreClient(session.user.storeId)
    await userClient.catalogue.delete({
      where: { id: Number(id) },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[CATALOGUE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
