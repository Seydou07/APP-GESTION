"use client"
import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { saleSchema } from "@/lib/validations"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ShoppingBag, User, Hash, Loader2, Plus, Trash2, ShoppingCart } from "lucide-react"
import { Receipt } from "./receipt"
import { ProductSearchableSelect } from "./product-searchable-select"

type SaleFormValues = z.infer<typeof saleSchema>

export function SaleForm() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [settings, setSettings] = useState<any>(null)
    const [lastSale, setLastSale] = useState<any>(null)

    // Local state for current selection before adding to cart
    const [currentProductId, setCurrentProductId] = useState("")
    const [currentQuantity, setCurrentQuantity] = useState(1)

    useEffect(() => {
        fetch("/api/products").then(res => res.json()).then(setProducts)
        fetch("/api/settings").then(res => res.json()).then(setSettings)
    }, [])

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SaleFormValues>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            items: [],
            nomClient: "",
            prenomClient: "",
            numeroClient: "",
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    })

    const items = watch("items")
    const totalAmount = items?.reduce((sum, item) => sum + ((item.prixUnitaire || 0) * item.quantite), 0) || 0

    const handleAddToCart = () => {
        if (!currentProductId) {
            toast.error("Veuillez sélectionner un produit")
            return
        }

        const product = products.find((p: any) => p.id === Number(currentProductId)) as any
        if (!product) return

        if (product.quantite < currentQuantity) {
            toast.error("Stock insuffisant")
            return
        }

        // Check if item already in cart
        const existingItemIndex = items.findIndex(item => item.produitId === Number(currentProductId))
        if (existingItemIndex > -1) {
            toast.error("Ce produit est déjà dans le panier. Supprimez-le pour modifier la quantité.")
            return
        }

        append({
            produitId: Number(currentProductId),
            quantite: currentQuantity,
            designation: product.designation,
            prixUnitaire: product.prixUnitaire
        })

        setCurrentProductId("")
        setCurrentQuantity(1)
    }

    const onSubmit = async (values: SaleFormValues) => {
        if (values.items.length === 0) {
            toast.error("Le panier est vide")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                body: JSON.stringify(values),
            })
            if (!res.ok) throw new Error(await res.text())
            const saleData = await res.json()

            setLastSale({
                items: values.items.map(item => ({
                    designation: item.designation!,
                    quantite: item.quantite,
                    prixUnitaire: item.prixUnitaire!,
                })),
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

    const selectedProduct = products.find((p: any) => p.id === Number(currentProductId)) as any

    return (
        <div className="w-full space-y-6">
            <div className="bg-background p-8 rounded-2xl shadow-sm border space-y-8">
                <div className="flex items-center gap-3 text-primary mb-4 border-b pb-4">
                    < ShoppingBag className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Nouvelle Vente</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Part 1: Product Selection */}
                    <div className="lg:col-span-1 space-y-6 bg-muted/30 p-6 rounded-2xl border border-dashed">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Ajouter un produit
                        </h3>

                        <div className="space-y-2">
                            <Label>Produit</Label>
                            <ProductSearchableSelect
                                products={products}
                                onSelect={(id: string) => setCurrentProductId(id)}
                                selectedProductId={currentProductId}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Quantité</Label>
                            <Input
                                type="number"
                                value={currentQuantity}
                                onChange={(e) => setCurrentQuantity(Number(e.target.value))}
                                className="rounded-xl h-12"
                                min={1}
                            />
                        </div>

                        {selectedProduct && (
                            <div className="p-4 bg-primary/5 rounded-xl space-y-1 border border-primary/10">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Prix unitaire:</span>
                                    <span>{selectedProduct.prixUnitaire.toLocaleString()} F</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm">
                                    <span>Sous-total:</span>
                                    <span className="text-primary">{(selectedProduct.prixUnitaire * currentQuantity).toLocaleString()} F</span>
                                </div>
                            </div>
                        )}

                        <Button
                            type="button"
                            onClick={handleAddToCart}
                            className="w-full h-12 rounded-xl shadow-sm"
                            variant="secondary"
                        >
                            Ajouter au panier
                        </Button>
                    </div>

                    {/* Part 2: Cart and Client Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4" /> Panier ({fields.length} articles)
                                </h3>

                                {fields.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground bg-muted/10">
                                        Le panier est vide
                                    </div>
                                ) : (
                                    <div className="border rounded-2xl overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-sm min-w-[600px]">
                                            <thead>
                                                <tr className="bg-muted/50 border-b">
                                                    <th className="text-left p-4 font-medium text-muted-foreground uppercase text-[10px]">Désignation</th>
                                                    <th className="text-center p-4 font-medium text-muted-foreground uppercase text-[10px]">Prix</th>
                                                    <th className="text-center p-4 font-medium text-muted-foreground uppercase text-[10px]">Qté</th>
                                                    <th className="text-right p-4 font-medium text-muted-foreground uppercase text-[10px]">Total</th>
                                                    <th className="p-4"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fields.map((field, index) => (
                                                    <tr key={field.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                        <td className="p-4 font-medium">{field.designation}</td>
                                                        <td className="p-4 text-center">{field.prixUnitaire?.toLocaleString()} F</td>
                                                        <td className="p-4 text-center">
                                                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold">x{field.quantite}</span>
                                                        </td>
                                                        <td className="p-4 text-right font-bold text-primary">
                                                            {((field.prixUnitaire || 0) * (field.quantite || 0)).toLocaleString()} F
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => remove(index)}
                                                                className="text-destructive hover:bg-destructive/10 rounded-full"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-primary/5 font-bold">
                                                    <td colSpan={3} className="p-4 text-right">TOTAL GÉNÉRAL :</td>
                                                    <td className="p-4 text-right text-lg text-primary">{totalAmount.toLocaleString()} FCFA</td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-muted-foreground text-xs uppercase">
                                        <User size={14} /> Nom
                                    </Label>
                                    <Input {...register("nomClient")} placeholder="Client" className="rounded-xl h-11" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs uppercase">Prénom</Label>
                                    <Input {...register("prenomClient")} placeholder="Prénom" className="rounded-xl h-11" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-muted-foreground text-xs uppercase">
                                        <Hash size={14} /> Téléphone
                                    </Label>
                                    <Input {...register("numeroClient")} placeholder="Téléphone" className="rounded-xl h-11" />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || fields.length === 0}
                                className="w-full h-14 rounded-xl text-lg font-bold shadow-lg bg-primary text-white hover:bg-primary/90 transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Confirmer la Vente & Reçu"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
