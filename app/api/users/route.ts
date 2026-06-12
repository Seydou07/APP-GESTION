import { prisma, getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import bcrypt from "bcrypt"

export async function GET() {
    const session = await auth()
    if (!session || !session.user || (session.user as any)?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const userClient = getPrismaStoreClient((session.user as any).storeId);
        const users = await userClient.user.findMany({
            select: {
                id: true,
                pseudo: true,
                email: true,
                isActive: true,
                userRoles: { select: { role: { select: { name: true } } } },
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        })

        const mapped = users.map(u => ({
            id: u.id,
            pseudo: u.pseudo,
            email: u.email,
            isActive: u.isActive,
            role: u.userRoles[0]?.role.name || "VENDEUR",
            createdAt: u.createdAt,
        }))

        return NextResponse.json(mapped)
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

        const userClient = getPrismaStoreClient((session.user as any).storeId);

        const roleRecord = await prisma.role.findUnique({ where: { name: role } })
        if (!roleRecord) {
            return new NextResponse("Rôle invalide", { status: 400 })
        }

        const user = await userClient.user.create({
            data: {
                pseudo,
                email,
                password: hashedPassword,
                userRoles: {
                    create: { roleId: roleRecord.id }
                }
            },
            select: {
                id: true,
                pseudo: true,
                email: true,
                isActive: true,
                userRoles: { select: { role: { select: { name: true } } } },
            }
        })

        return NextResponse.json({
            id: user.id,
            pseudo: user.pseudo,
            email: user.email,
            isActive: user.isActive,
            role: user.userRoles[0]?.role.name || "VENDEUR",
        })
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

        if (id === session.user?.id) {
            return new NextResponse("Vous ne pouvez pas supprimer votre propre compte", { status: 400 })
        }

        const userClient = getPrismaStoreClient((session.user as any).storeId);
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

        const userClient = getPrismaStoreClient((session.user as any).storeId);

        const updateData: any = { pseudo, email }

        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }

        const user = await userClient.user.update({
            where: { id },
            data: updateData,
        })

        if (role) {
            const roleRecord = await prisma.role.findUnique({ where: { name: role } })
            if (roleRecord) {
                await prisma.userRole.deleteMany({ where: { userId: user.id } })
                await prisma.userRole.create({ data: { userId: user.id, roleId: roleRecord.id } })
            }
        }

        const updated = await userClient.user.findUnique({
            where: { id },
            select: {
                id: true,
                pseudo: true,
                email: true,
                isActive: true,
                userRoles: { select: { role: { select: { name: true } } } },
            }
        })

        return NextResponse.json({
            id: updated?.id,
            pseudo: updated?.pseudo,
            email: updated?.email,
            isActive: updated?.isActive,
            role: updated?.userRoles[0]?.role.name || "VENDEUR",
        })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return new NextResponse("Cet email est déjà utilisé", { status: 400 })
        }
        return new NextResponse("Internal Error", { status: 500 })
    }
}
