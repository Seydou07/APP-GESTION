"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { ProductDialog } from "./product-dialog"

export function ProductTable() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)

    const fetchProducts = () => {
        setLoading(true)
        fetch("/api/products")
            .then(res => res.json())
            .then(data => {
                setProducts(data)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleAdd = () => {
        setSelectedProduct(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (product: any) => {
        setSelectedProduct(product)
        setIsDialogOpen(true)
    }

    return (
        <div className="bg-background rounded-2xl shadow-sm border-none p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un produit..." className="pl-10 rounded-xl" />
                </div>
                <Button onClick={handleAdd} className="rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Produit
                </Button>
            </div>

            <ProductDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={fetchProducts}
                product={selectedProduct}
            />

            <div className="rounded-xl border">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent uppercase text-xs font-bold text-muted-foreground">
                            <TableHead>Designation</TableHead>
                            <TableHead>Prix Unitaire</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Chargement...</TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Aucun produit trouvé</TableCell>
                            </TableRow>
                        ) : products.map((product: any) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.designation}</TableCell>
                                <TableCell>{product.prixUnitaire} F</TableCell>
                                <TableCell>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold",
                                        product.quantite <= product.seuilAlerte ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                    )}>
                                        {product.quantite}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{product.categorie || "-"}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="rounded-full">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

