import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || (session.user as any).role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        const where: any = {}
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            }
        }

        const expenses = await prisma.depense.findMany({
            where,
            orderBy: {
                date: 'desc'
            }
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
        if (!session || (session.user as any).role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const body = await req.json()
        const { libelle, montant, categorie, notes, date } = body

        if (!libelle || !montant || !categorie) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const expense = await prisma.depense.create({
            data: {
                libelle,
                montant: parseFloat(montant),
                categorie,
                notes,
                date: date ? new Date(date) : new Date(),
            }
        })

        return NextResponse.json(expense)
    } catch (error) {
        console.error("[EXPENSES_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
