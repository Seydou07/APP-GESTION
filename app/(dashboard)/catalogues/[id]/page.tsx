"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ArrowLeft, Package, ShoppingCart } from "lucide-react"

interface Product {
    id: number
    name: string
    code: string
    salePrice: number
    stockLevels: { warehouseId: number, quantity: number }[]
    stockMin?: number
}

interface Category {
    id: number
    name: string
    description?: string
    image?: string
    products: Product[]
    _count: {
        products: number
    }
}

export default function CategoryDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [category, setCategory] = useState<Category | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/categories/${params.id}`)
            .then(res => res.json())
            .then(data => {
                setCategory(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [params.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Chargement...</p>
            </div>
        )
    }

    if (!category) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">Catégorie introuvable</p>
                <Button onClick={() => router.push('/catalogues')} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour aux catalogues
                </Button>
            </div>
        )
    }

    return (
        <div className="print:hidden">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/catalogues')}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    {category.image && (
                        <img 
                            src={category.image} 
                            alt={category.name} 
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border"
                        />
                    )}
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            {category.name}
                            <span className="text-sm font-normal px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                {category._count.products} produits
                            </span>
                        </h2>
                        {category.description && (
                            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                        )}
                    </div>
                </div>
                <Button
                    onClick={() => router.push(`/sales?category=${category.id}`)}
                    className="bg-[#1E3A8A] hover:bg-[#1E40AF]"
                >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Vendre ces produits
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50">
                    <h3 className="font-semibold text-lg">Liste des produits</h3>
                </div>
                {category.products.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun produit dans cette catégorie</p>
                        <p className="text-sm text-gray-400 mt-1">Allez dans la section Produits pour en ajouter.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                <TableHead className="pl-6">Designation</TableHead>
                                <TableHead>Prix</TableHead>
                                <TableHead>Stock Boutique</TableHead>
                                <TableHead>Stock Magasin</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {category.products.map((product) => {
                                const boutiqueStock = product.stockLevels?.find((sl: any) => sl.warehouseId === 1)?.quantity ?? 0
                                const magasinStock = product.stockLevels?.find((sl: any) => sl.warehouseId === 2)?.quantity ?? 0
                                const stockMin = product.stockMin ?? 5
                                
                                return (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium pl-6">
                                            <p className="font-bold text-sm">{product.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{product.code}</p>
                                        </TableCell>
                                        <TableCell className="font-mono font-medium">{product.salePrice.toLocaleString()} F</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                boutiqueStock <= stockMin ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                            )}>
                                                {boutiqueStock}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                magasinStock === 0 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-600"
                                            )}>
                                                {magasinStock}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}
