import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
    try {
        const settings = await (prisma as any).appSetting.findFirst()
        return NextResponse.json(settings || {
            appName: "K.M.BOMI",
            logoUrl: "",
            themeColor: "#3C91E6",
        })
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    // Cast to any to bypass strict NextAuth session types if not extended correctly
    const user = session.user as any
    if (user.role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const body = await req.json()
        const { appName, logoUrl, themeColor } = body

        const db = prisma as any
        const settings = await db.appSetting.findFirst()

        let result
        if (settings) {
            result = await db.appSetting.update({
                where: { id: settings.id },
                data: { appName, logoUrl, themeColor },
            })
        } else {
            result = await db.appSetting.create({
                data: { appName, logoUrl, themeColor },
            })
        }

        return NextResponse.json(result)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}
