"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema } from "@/lib/validations"
import { z } from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronsUpDown, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ProductFormValues = z.infer<typeof productSchema>

interface ProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    product?: any
}

export function ProductDialog({ open, onOpenChange, onSuccess, product }: ProductDialogProps) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [stockQuantity, setStockQuantity] = useState(0)
    const [selectedCategoryId, setSelectedCategoryId] = useState("")
    const [catSearch, setCatSearch] = useState("")
    const [catOpen, setCatOpen] = useState(false)
    const catRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => (a.nom || a.name || "").localeCompare(b.nom || b.name || "", "fr"))
    }, [categories])

    const filteredCategories = useMemo(() => {
        if (!catSearch) return sortedCategories
        const q = catSearch.toLowerCase()
        return sortedCategories.filter(c => (c.nom || c.name || "").toLowerCase().includes(q))
    }, [sortedCategories, catSearch])

    useEffect(() => {
        fetch("/api/categories").then(res => res.json()).then(data => {
            if (Array.isArray(data)) setCategories(data)
        })
    }, [])

    useEffect(() => {
        if (catOpen && searchRef.current) {
            searchRef.current.focus()
        }
    }, [catOpen])

    useEffect(() => {
        if (!catOpen) setCatSearch("")
    }, [catOpen])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (catRef.current && !catRef.current.contains(e.target as Node)) {
                setCatOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const selectedCatName = selectedCategoryId
        ? sortedCategories.find(c => String(c.id) === selectedCategoryId)?.nom
            || sortedCategories.find(c => String(c.id) === selectedCategoryId)?.name
            || ""
        : ""

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            code: "",
            name: "",
            salePrice: 0,
            costPrice: 0,
            unit: "pièce",
            stockMin: 5,
            description: "",
        }
    })

    useEffect(() => {
        if (product) {
            reset({
                code: product.code || "",
                name: product.name,
                salePrice: product.salePrice,
                costPrice: product.costPrice || 0,
                unit: product.unit || "pièce",
                stockMin: product.stockMin || 5,
                description: product.description || "",
            })
            setSelectedCategoryId(product.categoryId ? String(product.categoryId) : "")
            setStockQuantity(0)
        } else {
            reset({
                code: "",
                name: "",
                salePrice: 0,
                costPrice: 0,
                unit: "pièce",
                stockMin: 5,
                description: "",
            })
            setSelectedCategoryId("")
            setStockQuantity(0)
        }
    }, [product, reset, open])

    const onSubmit = async (data: ProductFormValues) => {
        setLoading(true)
        try {
            const url = "/api/products"
            const method = product ? "PUT" : "POST"

            const body: any = {
                ...data,
                categoryId: selectedCategoryId ? Number(selectedCategoryId) : null,
            }
            if (product) body.id = product.id
            if (!product) body.stockQuantity = stockQuantity

            const res = await fetch(url, {
                method,
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                const err = await res.text()
                throw new Error(err || "Erreur serveur")
            }

            toast.success(product ? "Produit mis à jour" : "Produit ajouté avec succès")
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{product ? "Modifier le produit" : "Nouveau Produit"}</DialogTitle>
                    <DialogDescription>
                        Remplissez les détails du produit.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Code *</Label>
                            <Input {...register("code")} placeholder="Ex: CIM-001" className="rounded-xl" />
                            {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Désignation *</Label>
                            <Input {...register("name")} placeholder="Ex: Ciment 50kg" className="rounded-xl" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Prix Vente (F) *</Label>
                            <Input type="number" step="0.01" {...register("salePrice")} className="rounded-xl" />
                            {errors.salePrice && <p className="text-xs text-red-500">{errors.salePrice.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Prix Revient (F)</Label>
                            <Input type="number" step="0.01" {...register("costPrice")} className="rounded-xl" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Unité</Label>
                            <Select value={register("unit").value as string || "pièce"} onValueChange={v => register("unit").onChange({ target: { value: v } })}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="pièce">Pièce</SelectItem>
                                    <SelectItem value="kg">Kg</SelectItem>
                                    <SelectItem value="litre">Litre</SelectItem>
                                    <SelectItem value="mètre">Mètre</SelectItem>
                                    <SelectItem value="carton">Carton</SelectItem>
                                    <SelectItem value="sac">Sac</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Seuil d'alerte</Label>
                            <Input type="number" {...register("stockMin")} className="rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-2" ref={catRef}>
                        <Label>Catégorie</Label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setCatOpen(!catOpen)}
                                className={cn(
                                    "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    catOpen && "ring-ring/50 ring-[3px]"
                                )}
                            >
                                <span className={cn("truncate", !selectedCatName && "text-muted-foreground")}>
                                    {selectedCatName || "Sélectionner une catégorie"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </button>

                            {catOpen && (
                                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border bg-popover text-popover-foreground shadow-md">
                                    <div className="flex items-center border-b px-3">
                                        <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <input
                                            ref={searchRef}
                                            placeholder="Rechercher..."
                                            value={catSearch}
                                            onChange={e => setCatSearch(e.target.value)}
                                            className="flex h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto p-1">
                                        {filteredCategories.length === 0 ? (
                                            <div className="py-6 text-center text-sm text-muted-foreground">Aucune catégorie trouvée</div>
                                        ) : filteredCategories.map((cat: any) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCategoryId(String(cat.id))
                                                    setCatOpen(false)
                                                }}
                                                className={cn(
                                                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                                                    "hover:bg-accent hover:text-accent-foreground",
                                                    selectedCategoryId === String(cat.id) && "bg-accent font-medium"
                                                )}
                                            >
                                                <Check className={cn(
                                                    "h-4 w-4 shrink-0",
                                                    selectedCategoryId === String(cat.id) ? "opacity-100" : "opacity-0"
                                                )} />
                                                <span className="truncate">{cat.nom || cat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {!product && (
                        <div className="space-y-2">
                            <Label>Stock Initial</Label>
                            <Input type="number" min="0" value={stockQuantity} onChange={e => setStockQuantity(Number(e.target.value))} className="rounded-xl" placeholder="0" />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full rounded-xl h-12">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {product ? "Mettre à jour" : "Ajouter le produit"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
