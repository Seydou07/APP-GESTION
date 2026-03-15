import { NextResponse } from "next/server"
import { getPrismaUserClient } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { suggestionSchema } from "@/lib/validations"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        // Validate input
        const validatedData = suggestionSchema.parse(body)

        // Get author from session if available
        const session = await auth()
        const auteur = validatedData.auteur || session?.user?.name || "Anonyme"
        const email = validatedData.email || session?.user?.email || null

        const boutiqueId = session?.user ? (session.user as any).boutiqueId : 1;
        const userClient = getPrismaUserClient(boutiqueId);

        // Create suggestion in DB
        const suggestion = await userClient.suggestion.create({
            data: {
                sujet: validatedData.sujet,
                message: validatedData.message,
                auteur,
                email,
            }
        })

        return NextResponse.json(suggestion)
    } catch (error: any) {
        console.error("Suggestion Error:", error)
        if (error.name === "ZodError") {
            return new NextResponse(JSON.stringify(error.errors), { status: 400 })
        }
        return new NextResponse(error.message || "Internal Server Error", { status: 500 })
    }
}
