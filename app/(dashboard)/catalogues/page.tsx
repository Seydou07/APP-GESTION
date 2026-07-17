"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Plus, Trash2, Edit, Image as ImageIcon, ArrowLeft, Package, Search, Truck, ArrowUpAZ, ArrowDownAZ, ChevronsUpDown, AlertTriangle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface Category {
    id: number
    nom: string
    image: string
    keywords: string[]
    description: string
}

interface Product {
    id: number
    designation: string
    quantite: number
    prixUnitaire: number
    categorieId?: number
    categorie?: {
        id: number
        nom: string
    }
    quantiteMagasin?: number
}

export default function CataloguesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState<"catalogues" | "products">("catalogues")
    const [searchQuery, setSearchQuery] = useState("")
    const [imageErrors, setImageErrors] = useState<Record<number, { hasError: boolean; reason?: string }>>({})
    const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [categoryPage, setCategoryPage] = useState(1)
    const [categoryPageSize, setCategoryPageSize] = useState(8)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
    const [isProductDeleteConfirmOpen, setIsProductDeleteConfirmOpen] = useState(false)
    const [productToDelete, setProductToDelete] = useState<number | null>(null)
    const [categorySearchQuery, setCategorySearchQuery] = useState("")

    const [formData, setFormData] = useState({
        nom: "",
        image: "",
        keywords: "",
        description: ""
    })

    useEffect(() => {
        fetchCategories()
        fetchProducts()
    }, [])

    useEffect(() => setPage(1), [searchQuery, products, pageSize])

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories")
            const data = await res.json()
            if (Array.isArray(data)) setCategories(data)
            else setCategories([])
        } catch (error) {
            toast.error("Erreur lors du chargement des catégories")
            setCategories([])
        }
    }

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products")
            const data = await res.json()
            // Transform products to match interface
            const transformedProducts = data.map((prod: any) => ({
                id: prod.id,
                designation: prod.name,
                quantite: prod.stockLevels?.find((sl: any) => sl.warehouseId === 1)?.quantity ?? 0,
                prixUnitaire: prod.salePrice,
                categorieId: prod.categoryId,
                categorie: prod.category ? { id: prod.category.id, nom: prod.category.name } : undefined,
                quantiteMagasin: prod.stockLevels?.find((sl: any) => sl.warehouseId === 2)?.quantity ?? 0
            }))
            setProducts(transformedProducts)
        } catch (error) {
            toast.error("Erreur lors du chargement des produits")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const keywordsArray = formData.keywords
                .split(",")
                .map(k => k.trim().toLowerCase())
                .filter(k => k.length > 0)

            const payload = {
                nom: formData.nom,
                image: formData.image,
                keywords: keywordsArray,
                description: formData.description
            }

            const res = await fetch("/api/categories", {
                method: selectedCategory ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedCategory ? { ...payload, id: selectedCategory.id } : payload)
            })

            if (res.ok) {
                toast.success(selectedCategory ? "Catégorie modifiée" : "Catégorie créée")
                setIsDialogOpen(false)
                resetForm()
                fetchCategories()
            } else {
                toast.error("Erreur lors de l'enregistrement")
            }
        } catch (error) {
            toast.error("Erreur serveur")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        setCategoryToDelete(id)
        setIsDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return

        try {
            const res = await fetch("/api/categories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: categoryToDelete })
            })

            if (res.ok) {
                toast.success("Catégorie supprimée")
                fetchCategories()
            } else {
                toast.error("Erreur lors de la suppression")
            }
        } catch (error) {
            toast.error("Erreur serveur")
        } finally {
            setIsDeleteConfirmOpen(false)
            setCategoryToDelete(null)
        }
    }

    const handleProductDelete = (id: number) => {
        setProductToDelete(id)
        setIsProductDeleteConfirmOpen(true)
    }

    const handleConfirmProductDelete = async () => {
        if (!productToDelete) return

        try {
            const res = await fetch("/api/products", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: productToDelete })
            })

            if (res.ok) {
                toast.success("Produit supprimé")
                fetchProducts()
            } else {
                toast.error("Erreur lors de la suppression")
            }
        } catch (error) {
            toast.error("Erreur serveur")
        } finally {
            setIsProductDeleteConfirmOpen(false)
            setProductToDelete(null)
        }
    }

    const handleEdit = (category: Category) => {
        setSelectedCategory(category)
        setFormData({
            nom: category.nom,
            image: category.image,
            keywords: Array.isArray(category.keywords) ? category.keywords.join(", ") : "",
            description: category.description
        })
        setIsDialogOpen(true)
    }

    const resetForm = () => {
        setSelectedCategory(null)
        setFormData({
            nom: "",
            image: "",
            keywords: "",
            description: ""
        })
    }

    const handleViewProducts = (category: Category) => {
        setSelectedCategory(category)
        setViewMode("products")
        setSearchQuery("")
    }

    const handleBackToCatalogues = () => {
        setSelectedCategory(null)
        setViewMode("catalogues")
        setSearchQuery("")
    }

    const handleImageError = (categoryId: number, reason: string = "Erreur de chargement") => {
        setImageErrors(prev => ({
            ...prev,
            [categoryId]: { hasError: true, reason }
        }))
    }

    const handleImageLoad = (categoryId: number) => {
        setImageErrors(prev => ({
            ...prev,
            [categoryId]: { hasError: false, reason: undefined }
        }))
    }

    const retryImage = (categoryId: number) => {
        setImageErrors(prev => {
            const newState = { ...prev }
            delete newState[categoryId]
            return newState
        })
    }

    const validateImageUrl = (url: string): boolean => {
        if (!url || url.trim() === "") return false
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }

    const getCategoryProductCount = (categoryId: number) => {
        return products.filter(p => p.categorieId === categoryId).length
    }

    const getFilteredCategories = () => {
        if (!categorySearchQuery) return categories

        return categories.filter(category =>
            category.nom.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
            category.description?.toLowerCase().includes(categorySearchQuery.toLowerCase())
        )
    }

    const categoryStartIndex = (categoryPage - 1) * categoryPageSize
    const categoryEndIndex = categoryStartIndex + categoryPageSize
    const paginatedCategories = getFilteredCategories().slice(categoryStartIndex, categoryEndIndex)

    const cycleSortOrder = () => {
        setSortOrder(prev => prev === "default" ? "asc" : prev === "asc" ? "desc" : "default")
    }

    const getFilteredProducts = () => {
        if (!selectedCategory) return []

        let categoryProducts = products.filter(p => p.categorieId === selectedCategory.id)

        if (searchQuery) {
            categoryProducts = categoryProducts.filter(p =>
                p.designation.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        if (sortOrder === "asc") {
            categoryProducts.sort((a, b) => a.designation.localeCompare(b.designation, "fr", { sensitivity: "base" }))
        } else if (sortOrder === "desc") {
            categoryProducts.sort((a, b) => b.designation.localeCompare(a.designation, "fr", { sensitivity: "base" }))
        }

        return categoryProducts
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Catalogues</h1>
                    <p className="text-muted-foreground">Gérez vos catégories de produits</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setSelectedCategory(null)}>
                            <Plus className="w-4 h-4 mr-2" /> Nouvelle catégorie
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {selectedCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="nom">Nom</Label>
                                <Input
                                    id="nom"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="image">URL de l'image</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="image"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        placeholder="https://..."
                                        className={formData.image && !validateImageUrl(formData.image) ? "border-red-500" : ""}
                                    />
                                    {formData.image && (
                                        <div className="w-16 h-16 rounded-lg overflow-hidden border bg-muted">
                                            {validateImageUrl(formData.image) ? (
                                                <img
                                                    src={formData.image}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect fill='%23f1f5f9' width='64' height='64'/%3E%3Ctext fill='%2364748b' font-family='sans-serif' font-size='10' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage cassée%3C/text%3E%3C/svg%3E"
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                                    Invalid URL
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {formData.image && !validateImageUrl(formData.image) && (
                                    <p className="text-xs text-red-500 mt-1">URL d'image invalide</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">L'URL doit commencer par http:// ou https://</p>
                            </div>
                            <div>
                                <Label htmlFor="keywords">Mots-clés (séparés par des virgules)</Label>
                                <Input
                                    id="keywords"
                                    value={formData.keywords}
                                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                    placeholder="ex: laptop, portable, notebook"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Enregistrement..." : selectedCategory ? "Modifier" : "Créer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {viewMode === "catalogues" && (
                <>
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher une catégorie..."
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                            className="pl-10 rounded-xl h-12"
                        />
                    </div>

                    {categories.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-2xl">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Aucune catégorie créée</p>
                            <p className="text-sm text-muted-foreground mt-2">Créez votre première catégorie pour commencer</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {paginatedCategories.map((category) => {
                                    const productCount = getCategoryProductCount(category.id)
                                    const imageError = imageErrors[category.id]
                                    const hasImageError = imageError?.hasError
                                    const isValidImage = category.image && validateImageUrl(category.image)

                                    return (
                                        <div
                                            key={category.id}
                                            className="group relative overflow-hidden rounded-2xl border-2 hover:border-primary/50 transition-all duration-200 cursor-pointer"
                                            onClick={() => handleViewProducts(category)}
                                        >
                                            <div className="aspect-[3/4] relative">
                                                {hasImageError ? (
                                                    <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-4">
                                                        <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                                                        <p className="text-sm text-muted-foreground text-center mb-2">Image non disponible</p>
                                                        <p className="text-xs text-muted-foreground/60 text-center mb-3">{imageError?.reason}</p>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => retryImage(category.id)}
                                                            className="text-xs"
                                                        >
                                                            Réessayer
                                                        </Button>
                                                    </div>
                                                ) : isValidImage ? (
                                                    <img
                                                        src={category.image}
                                                        alt={category.nom}
                                                        className="w-full h-full object-cover"
                                                        onError={() => handleImageError(category.id)}
                                                        onLoad={() => handleImageLoad(category.id)}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
                                                        <div className="text-6xl font-bold text-purple-200">
                                                            {category.nom?.charAt(0) || "?"}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="font-bold text-lg">{category.nom}</h3>
                                                        {hasImageError && (
                                                            <span className="text-xs bg-amber-500/80 px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                                                                <ImageIcon className="w-3 h-3" />
                                                                Image
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-white/80 line-clamp-2 mb-2">{category.description}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Package className="w-4 h-4" />
                                                        <span className="text-xs bg-primary/80 px-3 py-1 rounded-full backdrop-blur-sm">
                                                            {productCount} produit{productCount > 1 ? "s" : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleEdit(category)
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="h-8 w-8 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(category.id)
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {getFilteredCategories().length > 0 && (
                                <Pagination
                                    total={getFilteredCategories().length}
                                    page={categoryPage}
                                    pageSize={categoryPageSize}
                                    onPageChange={setCategoryPage}
                                    onPageSizeChange={(s) => { setCategoryPageSize(s); setCategoryPage(1) }}
                                    sizes={[4, 8, 12, 16]}
                                />
                            )}
                        </>
                    )}
                </>
            )}
            {viewMode === "products" && selectedCategory && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleBackToCatalogues}
                            className="rounded-full hover:bg-muted"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2 flex-1">
                            <div className={cn(
                                "w-10 h-10 rounded-lg overflow-hidden border",
                                imageErrors[selectedCategory.id]?.hasError || !selectedCategory.image ? "bg-muted" : ""
                            )}>
                                {imageErrors[selectedCategory.id]?.hasError || !selectedCategory.image ? (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                ) : (
                                    <img
                                        src={selectedCategory.image}
                                        alt={selectedCategory.nom}
                                        className="w-full h-full object-cover"
                                        onError={() => handleImageError(selectedCategory.id)}
                                        onLoad={() => handleImageLoad(selectedCategory.id)}
                                    />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold">{selectedCategory.nom}</h3>
                                <span className="text-sm text-muted-foreground">
                                    {getFilteredProducts().length} produit{getFilteredProducts().length > 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un produit..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-xl h-12"
                        />
                    </div>

                    <div className="rounded-xl border">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                    <TableHead
                                        className="pl-6 cursor-pointer select-none group"
                                        onClick={cycleSortOrder}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            Désignation
                                            {sortOrder === "asc" ? (
                                                <ArrowUpAZ className="w-3.5 h-3.5 text-primary" />
                                            ) : sortOrder === "desc" ? (
                                                <ArrowDownAZ className="w-3.5 h-3.5 text-primary" />
                                            ) : (
                                                <ChevronsUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                                            )}
                                        </span>
                                    </TableHead>
                                    <TableHead>Prix Unitaire</TableHead>
                                    <TableHead>Stock Boutique</TableHead>
                                    <TableHead>Stock Magasin</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getFilteredProducts().length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            {searchQuery ? "Aucun produit ne correspond à votre recherche" : "Aucun produit dans cette catégorie"}
                                        </TableCell>
                                    </TableRow>
                                ) : getFilteredProducts().slice((page - 1) * pageSize, page * pageSize).map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium pl-6">{product.designation}</TableCell>
                                        <TableCell>{product.prixUnitaire.toLocaleString()} F</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                (product as any).stockMin && product.quantite <= (product as any).stockMin ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                            )}>
                                                {product.quantite}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                (product as any).quantiteMagasin === 0 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-600"
                                            )}>
                                                {product.quantiteMagasin ?? 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{product.categorie?.nom ?? "-"}</TableCell>
                                        <TableCell className="text-right space-x-1 pr-6">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Transférer vers Boutique"
                                                disabled={(product as any).quantiteMagasin <= 0}
                                                className={cn(
                                                    "rounded-full text-primary hover:text-primary hover:bg-primary/10",
                                                    (product as any).quantiteMagasin <= 0 && "opacity-40"
                                                )}
                                            >
                                                <Truck className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="rounded-full">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleProductDelete(product.id)}
                                                className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {getFilteredProducts().length > 0 && (
                            <div className="border-t px-6 py-4">
                                <Pagination
                                    total={getFilteredProducts().length}
                                    page={page}
                                    pageSize={pageSize}
                                    onPageChange={setPage}
                                    onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
                                    sizes={[4, 8, 12, 16, 24]}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
            <ConfirmDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                title="Supprimer la catégorie ?"
                description="Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible et tous les produits associés seront affectés."
                icon={AlertTriangle}
                onConfirm={handleConfirmDelete}
                confirmText="Oui, supprimer"
            />
            <ConfirmDialog
                open={isProductDeleteConfirmOpen}
                onOpenChange={setIsProductDeleteConfirmOpen}
                title="Supprimer le produit ?"
                description="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
                icon={AlertTriangle}
                onConfirm={handleConfirmProductDelete}
                confirmText="Oui, supprimer"
            />
        </div>
    )
}
