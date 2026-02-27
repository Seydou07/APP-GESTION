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
import { MoreHorizontal, Plus, Search, Pencil, Eye, Box, Trash2, AlertTriangle, ArrowUpAZ, ArrowDownZA, ChevronsUpDown } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"

import { ProductDialog } from "./product-dialog"

export function ProductTable() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [productToDelete, setProductToDelete] = useState<number | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default")

    const cycleSortOrder = () => {
        setSortOrder(prev => prev === "default" ? "asc" : prev === "asc" ? "desc" : "default")
    }

    // Pagination
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // reset page when filters/data change
    useEffect(() => setPage(1), [searchTerm, products, pageSize])

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

    // Filter + sort products
    const filteredProducts = products
        .filter((product: any) =>
            product.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.categorie && product.categorie.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a: any, b: any) => {
            if (sortOrder === "asc") return a.designation.localeCompare(b.designation, "fr", { sensitivity: "base" })
            if (sortOrder === "desc") return b.designation.localeCompare(a.designation, "fr", { sensitivity: "base" })
            return 0
        })

    return (
        <div className="bg-background rounded-2xl shadow-sm border-none p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un produit..."
                            className="pl-10 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={cycleSortOrder}
                        className={cn(
                            "rounded-xl shrink-0 transition-all",
                            sortOrder !== "default" && "border-primary text-primary bg-primary/5"
                        )}
                        title={sortOrder === "default" ? "Trier A → Z" : sortOrder === "asc" ? "Trier Z → A" : "Annuler le tri"}
                    >
                        {sortOrder === "asc" ? <ArrowUpAZ className="w-4 h-4" /> : sortOrder === "desc" ? <ArrowDownZA className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
                    </Button>
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
                            <TableHead
                                className="pl-6 cursor-pointer select-none group"
                                onClick={cycleSortOrder}
                            >
                                <span className="flex items-center gap-1.5">
                                    Designation
                                    {sortOrder === "asc" ? (
                                        <ArrowUpAZ className="w-3.5 h-3.5 text-primary" />
                                    ) : sortOrder === "desc" ? (
                                        <ArrowDownZA className="w-3.5 h-3.5 text-primary" />
                                    ) : (
                                        <ChevronsUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                                    )}
                                </span>
                            </TableHead>
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
                        ) : filteredProducts.slice((page - 1) * pageSize, page * pageSize).map((product: any) => (
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

                {/* Pagination */}
                {filteredProducts.length > pageSize && (
                    <div className="border-t">
                        <Pagination
                            total={filteredProducts.length}
                            page={page}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
                            sizes={[10, 20, 50]}
                        />
                    </div>
                )}
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

