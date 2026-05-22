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
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type ProductFormValues = z.infer<typeof productSchema>

interface ProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    product?: any // For editing
}

export function ProductDialog({ open, onOpenChange, onSuccess, product }: ProductDialogProps) {
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            designation: "",
            prixUnitaire: 0,
            quantite: 0,
            quantiteMagasin: 0,
            categorie: "",
            seuilAlerte: 5,
        }
    })


    useEffect(() => {
        if (product) {
            reset(product)
        } else {
            reset({
                designation: "",
                prixUnitaire: 0,
                quantite: 0,
                quantiteMagasin: 0,
                categorie: "",
                seuilAlerte: 5,
            })
        }
    }, [product, reset, open])

    const onSubmit = async (data: ProductFormValues) => {
        setLoading(true)
        try {
            const url = "/api/products"
            const method = product ? "PUT" : "POST"

            // For updates, we might need the ID in the body or URL
            const body = product ? { ...data, id: product.id } : data

            const res = await fetch(url, {
                method,
                body: JSON.stringify(body),
            })

            if (!res.ok) throw new Error("Erreur serveur")

            toast.success(product ? "Produit mis à jour" : "Produit ajouté avec succès")
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast.error("Une erreur est survenue")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{product ? "Modifier le produit" : "Nouveau Produit"}</DialogTitle>
                    <DialogDescription>
                        Remplissez les détails du produit ici. Cliquez sur enregistrer quand vous avez fini.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="designation">Désignation</Label>
                        <Input id="designation" {...register("designation")} placeholder="Ex: Ciment 50kg" />
                        {errors.designation && <p className="text-xs text-red-500">{errors.designation.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="prixUnitaire">Prix Unitaire (F)</Label>
                            <Input id="prixUnitaire" type="number" {...register("prixUnitaire")} />
                            {errors.prixUnitaire && <p className="text-xs text-red-500">{errors.prixUnitaire.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seuilAlerte">Seuil d'alerte</Label>
                            <Input id="seuilAlerte" type="number" {...register("seuilAlerte")} />
                            {errors.seuilAlerte && <p className="text-xs text-red-500">{errors.seuilAlerte.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantite">Stock Boutique</Label>
                            <Input id="quantite" type="number" {...register("quantite")} />
                            {errors.quantite && <p className="text-xs text-red-500">{errors.quantite.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantiteMagasin">Stock Magasin</Label>
                            <Input id="quantiteMagasin" type="number" {...register("quantiteMagasin")} />
                            {errors.quantiteMagasin && <p className="text-xs text-red-500">{errors.quantiteMagasin.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="categorie">Catégorie</Label>
                        <Input id="categorie" {...register("categorie")} placeholder="Ex: Matériaux" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {product ? "Mettre à jour" : "Ajouter le produit"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
