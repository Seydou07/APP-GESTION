"use client"

import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Product {
    id: number
    designation: string
    quantite: number
    prixUnitaire: number
}

interface ProductSearchableSelectProps {
    products: Product[]
    onSelect: (productId: string) => void
    selectedProductId: string
}

export function ProductSearchableSelect({ products, onSelect, selectedProductId }: ProductSearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedProduct = products.find(p => p.id === Number(selectedProductId))

    const filteredProducts = products.filter(p =>
        p.designation.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between w-full h-12 px-4 bg-background border rounded-xl cursor-pointer transition-all",
                    isOpen ? "ring-2 ring-primary border-primary" : "border-muted hover:border-primary/50"
                )}
            >
                <div className="flex-1 truncate">
                    {selectedProduct ? (
                        <span className="font-medium">{selectedProduct.designation}</span>
                    ) : (
                        <span className="text-muted-foreground">Sélectionner un produit</span>
                    )}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </div>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 overflow-hidden bg-white border rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
                    {/* Design Header as requested by user image */}
                    <div className="bg-gray-600 text-white px-4 py-3 text-sm font-bold flex items-center justify-between">
                        <span>Sélectionner</span>
                        <Search className="w-4 h-4 opacity-50" />
                    </div>

                    {/* Search Input */}
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 border-none shadow-none focus-visible:ring-0 bg-muted/30"
                            autoFocus
                        />
                    </div>

                    {/* Products List */}
                    <div className="max-h-[300px] overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Aucun produit trouvé
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => {
                                        onSelect(String(product.id))
                                        setIsOpen(false)
                                        setSearchQuery("")
                                    }}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors group border-b last:border-0",
                                        selectedProductId === String(product.id) && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-medium text-[15px] group-hover:text-primary transition-colors">
                                            {product.designation}
                                        </span>
                                        <span className="text-[13px] text-blue-600 font-medium whitespace-nowrap">
                                            ({product.quantite} en stock)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-400">
                                            {product.prixUnitaire.toLocaleString()} F
                                        </span>
                                        {selectedProductId === String(product.id) && (
                                            <Check className="w-4 h-4 text-primary" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
