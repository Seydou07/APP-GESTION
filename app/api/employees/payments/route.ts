import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || (session.user as any).role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const payments = await prisma.paiementEmploye.findMany({
            include: {
                employe: true
            },
            orderBy: {
                date: 'desc'
            }
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
        if (!session || (session.user as any).role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const body = await req.json()
        const { employeId, montant, periode, note, date } = body

        if (!employeId || !montant || !periode) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const employe = await prisma.employe.findUnique({
            where: { id: parseInt(employeId) }
        })

        if (!employe) {
            return new NextResponse("Employé introuvable", { status: 404 })
        }

        // Transaction: Create Payment AND Create Expense
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Payment Record
            const payment = await tx.paiementEmploye.create({
                data: {
                    employeId: parseInt(employeId),
                    montant: parseFloat(montant),
                    periode,
                    note,
                    date: date ? new Date(date) : new Date(),
                    reference: `PAY-${Date.now().toString().slice(-6)}`
                },
                include: {
                    employe: true
                }
            })

            // 2. Create corresponding Expense
            await tx.depense.create({
                data: {
                    libelle: `Salaire - ${employe.nom} ${employe.prenom} (${periode})`,
                    montant: parseFloat(montant),
                    categorie: "SALAIRE",
                    date: date ? new Date(date) : new Date(),
                    notes: `Paiement salaire automatique ref: ${payment.reference}`
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
