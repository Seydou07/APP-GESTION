"use client"

import { useState, useEffect } from "react"
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
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type ProductFormValues = z.infer<typeof productSchema>

interface ProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    product?: any
}

export function ProductDialog({ open, onOpenChange, onSuccess, product }: ProductDialogProps) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState([])
    const [stockQuantity, setStockQuantity] = useState(0)
    const [selectedCategoryId, setSelectedCategoryId] = useState("")

    useEffect(() => {
        fetch("/api/categories").then(res => res.json()).then(setCategories)
    }, [])

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

                    <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {categories.map((cat: any) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
