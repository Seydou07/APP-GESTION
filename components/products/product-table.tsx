"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Plus, Search, Pencil, Eye, Box, Trash2, AlertTriangle } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { ProductDialog } from "./product-dialog"

export function ProductTable() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [productToDelete, setProductToDelete] = useState<number | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")

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

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch("/api/products", {
                method: "DELETE",
                body: JSON.stringify({ id }),
            })

            if (!res.ok) throw new Error("Erreur serveur")

            toast.success("Produit supprimé")
            fetchProducts()
        } catch (error) {
            toast.error("Erreur lors de la suppression")
        }
    }

    // Filter products based on search term
    const filteredProducts = products.filter((product: any) =>
        product.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.categorie && product.categorie.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="bg-background rounded-2xl shadow-sm border-none p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un produit..."
                        className="pl-10 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={handleAdd} className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
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
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                            <TableHead className="pl-6">Designation</TableHead>
                            <TableHead>Prix Unitaire</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Chargement...</TableCell>
                            </TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {searchTerm ? "Aucun produit ne correspond à votre recherche" : "Aucun produit trouvé"}
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.map((product: any) => (
                            <TableRow key={product.id} className="hover:bg-muted/10 transition-colors">
                                <TableCell className="font-bold pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                            <Box className="w-4 h-4" />
                                        </div>
                                        {product.designation}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono">{product.prixUnitaire.toLocaleString()} F</TableCell>
                                <TableCell>
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                        product.quantite <= product.seuilAlerte ? "bg-red-100 text-red-600 border border-red-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    )}>
                                        {product.quantite} en stock
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md text-muted-foreground uppercase">
                                        {product.categorie || "Divers"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                setProductToDelete(product.id)
                                                setIsConfirmOpen(true)
                                            }}
                                            className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Supprimer le produit ?"
                description="Êtes-vous sûr de vouloir retirer ce produit du catalogue ? Cette action est irréversible."
                icon={AlertTriangle}
                onConfirm={() => productToDelete && handleDelete(productToDelete)}
                confirmText="Oui, supprimer"
            />
        </div>
    )
}

