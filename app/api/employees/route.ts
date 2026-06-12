import { auth } from "@/lib/auth"
import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { employeeSchema } from "@/lib/validations"

export async function GET() {
    try {
        const session = await auth()
        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const userClient = getPrismaStoreClient(session.user.storeId)
        const employees = await userClient.employee.findMany({
            orderBy: { lastName: "asc" }
        })

        return NextResponse.json(employees)
    } catch (error) {
        console.error("[EMPLOYEES_GET]", error)
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

        // Accept both English (firstName, lastName) and French (prenom, nom) field names
        const mappedBody = {
            firstName: body.firstName || body.prenom || "",
            lastName: body.lastName || body.nom || "",
            position: body.position || body.poste || "",
            phone: body.phone || body.telephone || "",
            salaryBase: body.salaryBase ?? body.salaireBase ?? 0,
        }

        const parsed = employeeSchema.parse(mappedBody)
        const userClient = getPrismaStoreClient(session.user.storeId)

        const employee = await userClient.employee.create({
            data: {
                firstName: parsed.firstName,
                lastName: parsed.lastName,
                position: parsed.position || null,
                phone: parsed.phone || null,
                salaryBase: parsed.salaryBase,
            }
        })

        return NextResponse.json(employee)
    } catch (error: any) {
        console.error("[EMPLOYEES_POST]", error)
        if (error.issues) return NextResponse.json({ error: error.issues }, { status: 400 })
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
