import { ProductTable } from "@/components/products/product-table"

export default function ProductsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold">Gestion des Produits</h2>
                <p className="text-muted-foreground">Consultez et gérez votre catalogue de produits.</p>
            </div>
            <ProductTable />
        </div>
    )
}
