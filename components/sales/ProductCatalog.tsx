"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Package, Plus, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

interface Category {
    id: number
    nom: string
    image: string
    keywords: string[]
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
}

interface ProductCatalogProps {
    products: Product[]
    categories: Category[]
    selectedProducts: Map<string, number>
    onToggleProduct: (productId: string, quantity: number) => void
}

export function ProductCatalog({ products, categories, selectedProducts, onToggleProduct }: ProductCatalogProps) {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [categorySearchQuery, setCategorySearchQuery] = useState("")
    const [categoryPage, setCategoryPage] = useState(1)
    const [categoryPageSize, setCategoryPageSize] = useState(8)
    const [productPage, setProductPage] = useState(1)
    const [productPageSize, setProductPageSize] = useState(12)

    const filteredProducts = selectedCategory
        ? products.filter(p => p.categorieId === selectedCategory)
        : products

    const searchedProducts = searchQuery
        ? filteredProducts.filter(p =>
            p.designation.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : filteredProducts

    const categoryCounts = categories.reduce((acc, cat) => {
        acc[cat.id] = products.filter(p => p.categorieId === cat.id).length
        return acc
    }, {} as Record<number, number>)

    const filteredCategories = categories.filter(category => {
        if (!categorySearchQuery) return true

        return category.nom.toLowerCase().includes(categorySearchQuery.toLowerCase())
    })

    const categoryStartIndex = (categoryPage - 1) * categoryPageSize
    const categoryEndIndex = categoryStartIndex + categoryPageSize
    const paginatedCategories = filteredCategories.slice(categoryStartIndex, categoryEndIndex)

    useEffect(() => {
        setProductPage(1)
    }, [selectedCategory])

    useEffect(() => {
        setCategoryPage(1)
    }, [categoryPageSize])

    useEffect(() => {
        setProductPage(1)
    }, [productPageSize])

    if (!selectedCategory) {
        return (
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une catégorie..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="pl-10 rounded-xl h-12"
                    />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {paginatedCategories.map((category: Category) => {
                        const count = categoryCounts[category.id] || 0

                        return (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={cn(
                                    "relative group overflow-hidden rounded-2xl border-2 transition-all duration-200",
                                    "hover:scale-105 active:scale-95 hover:shadow-lg",
                                    "border-border hover:border-primary/50"
                                )}
                            >
                                <div className="aspect-[3/4] relative bg-gradient-to-br from-purple-50 to-indigo-50">
                                    {category.image ? (
                                        <img
                                            src={category.image}
                                            alt={category.nom}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="text-6xl font-bold text-purple-200">
                                                {category.nom?.charAt(0) || "?"}
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                        <div className="font-bold text-center text-base mb-2">{category.nom}</div>
                                        <div className="text-xs bg-primary/80 px-3 py-1 rounded-full text-center backdrop-blur-sm">
                                            {count} produit{count > 1 ? "s" : ""}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {filteredCategories.length > 0 && (
                    <Pagination
                        total={filteredCategories.length}
                        page={categoryPage}
                        pageSize={categoryPageSize}
                        onPageChange={setCategoryPage}
                        onPageSizeChange={(s) => { setCategoryPageSize(s); setCategoryPage(1) }}
                        sizes={[4, 8, 12, 16]}
                    />
                )}
            </div>
        )
    }

    const productStartIndex = (productPage - 1) * productPageSize
    const productEndIndex = productStartIndex + productPageSize
    const paginatedProducts = searchedProducts.slice(productStartIndex, productEndIndex)

    const currentCategory = categories.find(c => c.id === selectedCategory)

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCategory(null)}
                    className="rounded-full hover:bg-muted"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2 flex-1">
                    <img
                        src={currentCategory?.image}
                        alt={currentCategory?.nom}
                        className="w-8 h-8 rounded-lg object-cover"
                    />
                    <h3 className="font-semibold">{currentCategory?.nom}</h3>
                    <span className="text-sm text-muted-foreground">
                        ({searchedProducts.length} produit{searchedProducts.length > 1 ? "s" : ""})
                    </span>
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {paginatedProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground bg-muted/10">
                        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="font-medium">Aucun produit dans cette catégorie</p>
                        <p className="text-sm mt-2">Cette catégorie est vide pour le moment</p>
                    </div>
                ) : (
                    paginatedProducts.map((product: Product) => {
                        const productId = String(product.id)
                        const cartQuantity = selectedProducts.get(productId) || 0

                        const handleCardClick = () => {
                            onToggleProduct(productId, cartQuantity > 0 ? 0 : 1)
                        }

                        const handleAdd = (e: React.MouseEvent) => {
                            e.stopPropagation()
                            if (product.quantite <= cartQuantity) return
                            onToggleProduct(productId, cartQuantity + 1)
                        }

                        const handleRemove = (e: React.MouseEvent) => {
                            e.stopPropagation()
                            onToggleProduct(productId, Math.max(0, cartQuantity - 1))
                        }

                        return (
                            <div
                                key={product.id}
                                onClick={handleCardClick}
                                className={cn(
                                    "relative p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col h-full",
                                    "hover:scale-[1.02]",
                                    cartQuantity > 0
                                        ? "border-primary bg-primary/5 shadow-md"
                                        : "border-border hover:border-primary/50 hover:bg-muted/30",
                                    product.quantite === 0 && "opacity-50 pointer-events-none"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-semibold leading-tight",
                                    product.quantite > 5
                                        ? "bg-green-100 text-green-700"
                                        : product.quantite > 0
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-red-100 text-red-700"
                                )}>
                                    {product.quantite}
                                </span>

                                <div className="space-y-1.5 flex-1">
                                    <div className="font-medium text-[13px] leading-snug line-clamp-2 pr-8 break-words">
                                        {product.designation}
                                    </div>
                                    <span className="text-sm font-bold text-primary block">
                                        {product.prixUnitaire.toLocaleString()} F
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                                    <button
                                        type="button"
                                        onClick={handleRemove}
                                        className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                                            cartQuantity > 0
                                                ? "bg-red-500 text-white hover:bg-red-600 active:scale-90 shadow-sm"
                                                : "bg-red-100 text-red-300"
                                        )}
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center text-xs font-bold tabular-nums">
                                        {cartQuantity}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleAdd}
                                        className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                                            product.quantite > 0 && cartQuantity < product.quantite
                                                ? "bg-green-500 text-white hover:bg-green-600 active:scale-90 shadow-sm"
                                                : "bg-green-100 text-green-300"
                                        )}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {searchedProducts.length > 0 && (
                <Pagination
                    total={searchedProducts.length}
                    page={productPage}
                    pageSize={productPageSize}
                    onPageChange={setProductPage}
                    onPageSizeChange={(s) => { setProductPageSize(s); setProductPage(1) }}
                    sizes={[4, 8, 12, 16, 24]}
                />
            )}
        </div>
    )
}
