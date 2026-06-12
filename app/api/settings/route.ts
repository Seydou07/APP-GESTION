import { getPrismaStoreClient } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function GET() {
    try {
        const session = await auth()
        const storeId = session?.user ? (session.user as any).storeId : 1;
        const userClient = getPrismaStoreClient(storeId);

        const settings = await userClient.appSetting.findFirst()
        return NextResponse.json(settings || {
            appName: "K.M.BOMI",
            logoUrl: "",
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

    const user = session.user as any
    if (user.role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const body = await req.json()
        const { appName, logoUrl } = body

        const userClient = getPrismaStoreClient(user.storeId)
        const settings = await userClient.appSetting.findFirst()

        let result
        if (settings) {
            result = await userClient.appSetting.update({
                where: { id: settings.id },
                data: { appName, logoUrl },
            })
        } else {
            result = await userClient.appSetting.create({
                data: { appName, logoUrl },
            })
        }

        // Force revalidation of all pages to pick up new theme/settings
        revalidatePath("/", "layout")

        return NextResponse.json(result)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}
