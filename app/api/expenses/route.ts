import { auth } from "@/lib/auth"
import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { expenseSchema } from "@/lib/validations"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        const where: any = {}
        if (startDate && endDate) {
            where.expenseDate = {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            }
        }

        const userClient = getPrismaStoreClient(session.user.storeId)
        const expenses = await userClient.expense.findMany({
            where,
            include: { category: true },
            orderBy: { expenseDate: "desc" }
        })

        return NextResponse.json(expenses)
    } catch (error) {
        console.error("[EXPENSES_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const body = await req.json()
        const parsed = expenseSchema.parse(body)
        const userClient = getPrismaStoreClient(session.user.storeId)

        // Map category name to ExpenseCategory if categoryId is not provided
        let categoryId = parsed.categoryId ?? null
        if (!categoryId && body.categoryName) {
            let cat = await userClient.expenseCategory.findFirst({
                where: { name: body.categoryName }
            })
            if (!cat) {
                cat = await userClient.expenseCategory.create({
                    data: { name: body.categoryName }
                })
            }
            categoryId = cat.id
        }

        const expense = await userClient.$transaction(async (tx) => {
            const created = await tx.expense.create({
                data: {
                    description: parsed.description || "",
                    amount: parsed.amount,
                    categoryId,
                    notes: parsed.notes || null,
                    expenseDate: parsed.expenseDate ? new Date(parsed.expenseDate) : new Date(),
                }
            })

            await tx.cashMovement.create({
                data: {
                    type: "SORTIE",
                    source: "DEPENSE",
                    referenceId: created.id,
                    amount: parsed.amount,
                    note: parsed.description || `Dépense #${created.id}`,
                    moveDate: parsed.expenseDate ? new Date(parsed.expenseDate) : new Date()
                }
            })

            return created
        })

        return NextResponse.json(expense)
    } catch (error: any) {
        console.error("[EXPENSES_POST]", error)
        if (error.issues) return NextResponse.json({ error: error.issues }, { status: 400 })
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
