"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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

const schema = z.object({
    quantite: z.coerce.number()
        .min(1, "La quantité doit être d'au moins 1")
})

type FormValues = z.infer<typeof schema>

interface TransferStockDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    product: any
}

export function TransferStockDialog({ open, onOpenChange, onSuccess, product }: TransferStockDialogProps) {
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            quantite: 1,
        }
    })

    useEffect(() => {
        if (open) {
            reset({ quantite: 1 })
        }
    }, [open, reset])

    const onSubmit = async (data: any) => {
        if (!product) return

        if (data.quantite > product.quantiteMagasin) {
            toast.error(`Le stock disponible au magasin est insuffisant (max: ${product.quantiteMagasin})`)
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/products/transfer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    produitId: product.id,
                    quantite: data.quantite,
                }),
            })

            if (!res.ok) {
                const text = await res.text()
                throw new Error(text || "Erreur lors du transfert")
            }

            toast.success(`${data.quantite} unité(s) transférée(s) avec succès !`)
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Transférer vers Boutique</DialogTitle>
                    <DialogDescription>
                        Déplacez des articles du magasin à la maison vers la boutique pour la vente.
                    </DialogDescription>
                </DialogHeader>
                {product && (
                    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 py-4">
                        <div className="bg-muted/40 p-4 rounded-xl space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-black tracking-wider">Produit</p>
                            <p className="font-bold text-base">{product.designation}</p>
                            <div className="grid grid-cols-2 gap-4 pt-2 mt-2 border-t text-xs">
                                <div>
                                    <span className="text-muted-foreground block">Stock Boutique:</span>
                                    <span className="font-bold text-foreground">{product.quantite}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Stock Magasin (Maison):</span>
                                    <span className="font-bold text-primary">{product.quantiteMagasin}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quantite">Quantité à transférer</Label>
                            <Input
                                id="quantite"
                                type="number"
                                {...register("quantite")}
                                placeholder="Entrez la quantité"
                                min={1}
                                max={product.quantiteMagasin}
                            />
                            {errors.quantite && <p className="text-xs text-red-500">{errors.quantite.message}</p>}
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={loading || product.quantiteMagasin <= 0} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmer le transfert
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
