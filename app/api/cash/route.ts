import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        const where: any = {}
        if (startDate && endDate) {
            where.moveDate = {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            }
        }

        const userClient = getPrismaStoreClient(session.user.storeId)

        // Fetch movements
        const movements = await userClient.cashMovement.findMany({
            where,
            orderBy: { moveDate: "desc" },
            include: {
                user: { select: { pseudo: true } }
            }
        })

        // Calculate theoretical balance (global or filtered, here we compute global balance to show current cash)
        const allMovements = await userClient.cashMovement.findMany({
            select: { type: true, amount: true }
        })

        const balance = allMovements.reduce((sum, mov) => {
            if (mov.type === "ENTREE") return sum + mov.amount
            return sum - mov.amount
        }, 0)

        return NextResponse.json({
            movements,
            balance
        })
    } catch (error) {
        console.error("[CASH_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { type, source, amount, note } = body // source: APPORTS, RETRAIT, etc.

        if (!type || !source || !amount || Number(amount) <= 0) {
            return new NextResponse("Champs requis ou invalides", { status: 400 })
        }

        const userClient = getPrismaStoreClient(session.user.storeId)

        const movement = await userClient.cashMovement.create({
            data: {
                type,
                source,
                amount: Number(amount),
                note: note || null,
                userId: Number(session.user.id),
                moveDate: new Date()
            }
        })

        return NextResponse.json(movement)
    } catch (error) {
        console.error("[CASH_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
