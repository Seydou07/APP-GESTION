"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { saleSchema } from "@/lib/validations"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ShoppingBag, User, Hash, Loader2 } from "lucide-react"
import { Receipt } from "./receipt"

type SaleFormValues = z.infer<typeof saleSchema>

export function SaleForm() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [settings, setSettings] = useState<any>(null)
    const [lastSale, setLastSale] = useState<any>(null)

    useEffect(() => {
        fetch("/api/products").then(res => res.json()).then(setProducts)
        fetch("/api/settings").then(res => res.json()).then(setSettings)
    }, [])

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            quantite: 1,
        }
    })

    const selectedProductId = watch("produitId")
    const selectedProduct = products.find((p: any) => p.id === Number(selectedProductId)) as any

    const onSubmit = async (values: SaleFormValues) => {
        setLoading(true)
        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                body: JSON.stringify(values),
            })
            if (!res.ok) throw new Error(await res.text())
            const saleData = await res.json()

            setLastSale({
                designation: selectedProduct?.designation,
                quantite: values.quantite,
                prixUnitaire: selectedProduct?.prixUnitaire,
                total: selectedProduct?.prixUnitaire * values.quantite,
                client: `${values.nomClient || ""} ${values.prenomClient || ""}`.trim(),
                date: new Date().toLocaleDateString(),
                logoUrl: settings?.logoUrl
            })

            toast.success("Vente enregistrée avec succès")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (lastSale) {
        return (
            <div className="space-y-6">
                <Receipt data={lastSale} />
                <div className="text-center print:hidden">
                    <Button variant="ghost" onClick={() => setLastSale(null)} className="rounded-xl">
                        Effectuer une autre vente
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-background p-8 rounded-2xl shadow-sm space-y-8">
            <div className="flex items-center gap-3 text-primary mb-4 border-b pb-4">
                < ShoppingBag className="w-6 h-6" />
                <h2 className="text-xl font-bold">Nouvelle Vente</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit as any)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Produit</Label>
                        <select
                            {...register("produitId")}
                            className="w-full h-12 rounded-xl border-muted bg-background px-3 focus:ring-primary outline-none border"
                        >
                            <option value="">Sélectionner un produit</option>
                            {products.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.designation} ({p.quantite} en stock)</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Quantité</Label>
                        <Input type="number" {...register("quantite")} className="rounded-xl h-12" />
                    </div>

                    {selectedProduct && (
                        <div className="p-4 bg-blue-50/50 rounded-xl space-y-2 border border-blue-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Prix unitaire:</span>
                                <span className="font-bold">{selectedProduct.prixUnitaire} F</span>
                            </div>
                            <div className="flex justify-between text-lg border-t pt-2 border-blue-200 mt-2">
                                <span>Total à payer:</span>
                                <span className="font-bold text-primary">{(selectedProduct.prixUnitaire * (Number(watch("quantite")) || 0)).toLocaleString()} F</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6 border-l pl-8">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                            <User size={16} /> Nom du Client
                        </Label>
                        <Input {...register("nomClient")} placeholder="Ex: Savadogo" className="rounded-xl h-12" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Prénom</Label>
                        <Input {...register("prenomClient")} placeholder="Ex: Jean" className="rounded-xl h-12" />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                            <Hash size={16} /> Téléphone
                        </Label>
                        <Input {...register("numeroClient")} placeholder="70 00 00 00" className="rounded-xl h-12" />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-14 rounded-xl text-lg font-bold mt-4 shadow-blue-200 shadow-lg bg-primary text-white hover:bg-primary/90">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : "Générer le Reçu"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
