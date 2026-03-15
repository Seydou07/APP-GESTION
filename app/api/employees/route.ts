import { auth } from "@/lib/auth"
import { getPrismaUserClient } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || (session.user as any).role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const userClient = getPrismaUserClient((session.user as any).boutiqueId);
        const employees = await userClient.employe.findMany({
            orderBy: {
                nom: 'asc'
            }
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
        if (!session || (session.user as any).role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const body = await req.json()
        const { nom, prenom, poste, telephone, salaireBase } = body

        if (!nom || !prenom || !salaireBase) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const userClient = getPrismaUserClient((session.user as any).boutiqueId);
        const employee = await userClient.employe.create({
            data: {
                nom,
                prenom,
                poste,
                telephone,
                salaireBase: parseFloat(salaireBase),
            }
        })

        return NextResponse.json(employee)
    } catch (error) {
        console.error("[EMPLOYEES_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
