import { ProductTable } from "@/components/products/product-table"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ProductsPage() {
    const session = await auth()

    if ((session?.user as any)?.role !== "ADMIN") {
        redirect("/")
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col">
                <h2 className="text-3xl font-black tracking-tight">Gestion des Produits</h2>
                <p className="text-muted-foreground">Consultez et gérez votre catalogue de produits en temps réel.</p>
            </div>
            <ProductTable />
        </div>
    )
}
