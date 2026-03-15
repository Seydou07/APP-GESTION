import { getPrismaUserClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import bcrypt from "bcrypt"

export async function GET() {
    const session = await auth()
    if (!session || !session.user || (session.user as any)?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const userClient = getPrismaUserClient((session.user as any).boutiqueId);
        const users = await userClient.user.findMany({
            select: {
                id: true,
                pseudo: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(users)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user || (session.user as any)?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { pseudo, email, password, role } = body

        if (!pseudo || !email || !password || !role) {
            return new NextResponse("Champs manquants", { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        
        const userClient = getPrismaUserClient((session.user as any).boutiqueId);
        const user = await userClient.user.create({
            data: {
                pseudo,
                email,
                password: hashedPassword,
                role,
            },
        })

        const { password: _, ...userWithoutPassword } = user
        return NextResponse.json(userWithoutPassword)
    } catch (error: any) {
        if (error.code === 'P2002') {
            return new NextResponse("Cet email est déjà utilisé", { status: 400 })
        }
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await auth()
    if (!session || !session.user || (session.user as any)?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { id } = body

        if (!id) {
            return new NextResponse("ID manquant", { status: 400 })
        }

        // Prevent self-deletion
        if (id === session.user?.id) {
            return new NextResponse("Vous ne pouvez pas supprimer votre propre compte", { status: 400 })
        }

        const userClient = getPrismaUserClient((session.user as any).boutiqueId);
        await userClient.user.delete({
            where: { id },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const session = await auth()
    if (!session || !session.user || (session.user as any)?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { id, pseudo, email, password, role } = body

        if (!id) {
            return new NextResponse("ID manquant", { status: 400 })
        }

        const updateData: any = {
            pseudo,
            email,
            role,
        }

        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }

        const userClient = getPrismaUserClient((session.user as any).boutiqueId);
        const user = await userClient.user.update({
            where: { id },
            data: updateData,
        })

        const { password: _, ...userWithoutPassword } = user
        return NextResponse.json(userWithoutPassword)
    } catch (error: any) {
        if (error.code === 'P2002') {
            return new NextResponse("Cet email est déjà utilisé", { status: 400 })
        }
        return new NextResponse("Internal Error", { status: 500 })
    }
}
