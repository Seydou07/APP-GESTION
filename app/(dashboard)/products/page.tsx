import { ProductTable } from "@/components/products/product-table"

export default function ProductsPage() {
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
