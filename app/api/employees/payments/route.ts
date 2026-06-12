import { auth } from "@/lib/auth"
import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const session = await auth()
        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const userClient = getPrismaStoreClient(session.user.storeId)
        const payments = await userClient.employeePayment.findMany({
            include: { employee: true },
            orderBy: { paymentDate: "desc" }
        })

        return NextResponse.json(payments)
    } catch (error) {
        console.error("[PAYMENTS_GET]", error)
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

        // Accept both English and French field names
        const employeeId = body.employeeId ?? body.employeId
        const amount = body.amount ?? body.montant
        const period = body.period ?? body.periode
        const note = body.note ?? null
        const paymentDate = body.paymentDate ?? body.date ?? new Date()

        if (!employeeId || !amount || !period) {
            return new NextResponse("Champs requis manquants", { status: 400 })
        }

        const userClient = getPrismaStoreClient(session.user.storeId)
        const employee = await userClient.employee.findUnique({
            where: { id: Number(employeeId) }
        })

        if (!employee) {
            return new NextResponse("Employé introuvable", { status: 404 })
        }

        const result = await userClient.$transaction(async (tx) => {
            const payment = await tx.employeePayment.create({
                data: {
                    employeeId: Number(employeeId),
                    amount: Number(amount),
                    period,
                    note,
                    paymentDate: new Date(paymentDate),
                    reference: `PAY-${Date.now().toString().slice(-6)}`
                },
                include: { employee: true }
            })

            let categoryId = null
            const salaireCategory = await tx.expenseCategory.findFirst({
                where: { name: "SALAIRE" }
            })
            categoryId = salaireCategory?.id || (
                await tx.expenseCategory.create({ data: { name: "SALAIRE" } })
            ).id

            await tx.expense.create({
                data: {
                    description: `Salaire - ${employee.lastName} ${employee.firstName} (${period})`,
                    amount: Number(amount),
                    categoryId,
                    notes: `Paiement salaire ref: ${payment.reference}`
                }
            })

            return payment
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("[PAYMENTS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
