"use client"

import { useEffect, useState } from "react"
import { Warehouse, Package, DollarSign, Truck, Search, ArrowUpAZ, ArrowDownZA, ChevronsUpDown, Info } from "lucide-react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TransferStockDialog } from "@/components/products/transfer-dialog"
import { cn, formatCompactNumber } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export default function MagasinPage() {
    const { data: session, status } = useSession()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [isTransferOpen, setIsTransferOpen] = useState(false)
    const [productToTransfer, setProductToTransfer] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default")

    const cycleSortOrder = () => {
        setSortOrder(prev => prev === "default" ? "asc" : prev === "asc" ? "desc" : "default")
    }

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
        if (status === "unauthenticated") {
            redirect("/login")
        }
        if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
            redirect("/")
        }

        fetchProducts()
    }, [status, session])

    // Reset page when filters change
    useEffect(() => setPage(1), [searchTerm, products, pageSize])

    if (status === "loading") return null

    // Filter and sort
    const filteredProducts = products
        .filter((p: any) =>
            p.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.categorie && p.categorie.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a: any, b: any) => {
            if (sortOrder === "asc") return a.designation.localeCompare(b.designation, "fr", { sensitivity: "base" })
            if (sortOrder === "desc") return b.designation.localeCompare(a.designation, "fr", { sensitivity: "base" })
            return 0
        })

    // Stats
    const totalArticlesMagasin = products.reduce((acc: number, p: any) => acc + (p.quantiteMagasin || 0), 0)
    const totalValeurMagasin = products.reduce((acc: number, p: any) => acc + (p.prixUnitaire * (p.quantiteMagasin || 0)), 0)
    const produitsEnMagasin = products.filter((p: any) => (p.quantiteMagasin || 0) > 0)
    const produitsVides = products.filter((p: any) => (p.quantiteMagasin || 0) === 0)

    const displayedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize)

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col">
                <h2 className="text-3xl font-black tracking-tight">Mon Magasin</h2>
                <p className="text-muted-foreground">Suivi des articles en réserve et réapprovisionnement de la boutique.</p>
            </div>

            {/* Stats Overview */}
            <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div
                        className="bg-background p-6 rounded-2xl flex items-center gap-6 shadow-sm hover:shadow-md transition-all border group cursor-default"
                        title={`${totalArticlesMagasin.toLocaleString()} unités`}
                    >
                        <div className="p-4 rounded-xl transition-colors bg-blue-100">
                            <Package className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                                {formatCompactNumber(totalArticlesMagasin)}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider">
                                    Articles en Magasin
                                </p>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                        Quantité totale de pièces stockées à la maison.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-background p-6 rounded-2xl flex items-center gap-6 shadow-sm hover:shadow-md transition-all border group cursor-default"
                        title={`${totalValeurMagasin.toLocaleString()} F`}
                    >
                        <div className="p-4 rounded-xl transition-colors bg-emerald-100">
                            <DollarSign className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                                {formatCompactNumber(totalValeurMagasin)} F
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider">
                                    Valeur du Magasin
                                </p>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                        Valeur financière totale des articles en réserve (Stock Magasin × Prix Unitaire).
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-background p-6 rounded-2xl flex items-center gap-6 shadow-sm hover:shadow-md transition-all border group cursor-default"
                        title={`${produitsEnMagasin.length} produits`}
                    >
                        <div className="p-4 rounded-xl transition-colors bg-indigo-100">
                            <Warehouse className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                                {formatCompactNumber(produitsEnMagasin.length)}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider">
                                    Produits Disponibles
                                </p>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                        Nombre de modèles/références différents ayant un stock disponible au magasin.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-background p-6 rounded-2xl flex items-center gap-6 shadow-sm hover:shadow-md transition-all border group cursor-default"
                        title={`${produitsVides.length} références sans stock magasin`}
                    >
                        <div className="p-4 rounded-xl transition-colors bg-amber-100">
                            <Package className="w-8 h-8 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                                {formatCompactNumber(produitsVides.length)}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider">
                                    Magasin Vide
                                </p>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                        Nombre de modèles/références n'ayant aucun stock enregistré au magasin.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>
            </TooltipProvider>

            {/* Inventory Table */}
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
                </div>

                <div className="rounded-xl border overflow-hidden">
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
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Prix Unitaire</TableHead>
                                <TableHead>Stock Magasin</TableHead>
                                <TableHead>Stock Boutique</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">Chargement...</TableCell>
                                </TableRow>
                            ) : displayedProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                                        {searchTerm ? "Aucun produit ne correspond à votre recherche" : "Aucun produit trouvé"}
                                    </TableCell>
                                </TableRow>
                            ) : displayedProducts.map((product: any) => (
                                <TableRow key={product.id}>
                                    <TableCell className="pl-6 font-bold">{product.designation}</TableCell>
                                    <TableCell className="text-muted-foreground">{product.categorie || "-"}</TableCell>
                                    <TableCell>{product.prixUnitaire.toLocaleString()} F</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold",
                                            product.quantiteMagasin === 0 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-600"
                                        )}>
                                            {product.quantiteMagasin}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold",
                                            product.quantite <= product.seuilAlerte ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                        )}>
                                            {product.quantite}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="Transférer vers Boutique"
                                                disabled={product.quantiteMagasin <= 0}
                                                onClick={() => {
                                                    setProductToTransfer(product)
                                                    setIsTransferOpen(true)
                                                }}
                                                className={cn(
                                                    "h-8 rounded-xl font-bold border-primary text-primary hover:bg-primary/5 flex items-center gap-1.5 transition-all",
                                                    product.quantiteMagasin <= 0 && "opacity-40 border-muted text-muted-foreground"
                                                )}
                                            >
                                                <Truck className="w-3.5 h-3.5" />
                                                Envoyer en Boutique
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {filteredProducts.length > pageSize && (
                    <div className="border-t pt-6">
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

            <TransferStockDialog
                open={isTransferOpen}
                onOpenChange={setIsTransferOpen}
                onSuccess={fetchProducts}
                product={productToTransfer}
            />
        </div>
    )
}
