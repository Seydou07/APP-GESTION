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
import { ShoppingBag, User, Hash, Loader2, Plus, Trash2, ShoppingCart, CreditCard } from "lucide-react"
import { Receipt } from "./receipt"
import { ProductSearchableSelect } from "./product-searchable-select"

type SaleFormValues = z.infer<typeof saleSchema>

export function SaleForm() {
    const [products, setProducts] = useState([])
    const [settings, setSettings] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [lastSale, setLastSale] = useState<any>(null)

    const [currentProductId, setCurrentProductId] = useState("")
    const [currentQuantity, setCurrentQuantity] = useState(1)
    const [remise, setRemise] = useState(0)
    const [commission, setCommission] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState("ESPECES")

    useEffect(() => {
        fetch("/api/products").then(res => res.json()).then(setProducts)
        fetch("/api/settings").then(res => res.json()).then(setSettings)
    }, [])

    const {
        register,
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<SaleFormValues>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            items: [],
            clientId: undefined,
            discount: 0,
            commission: 0,
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    })

    const items = watch("items")
    const subtotal = items?.reduce((sum, item) => sum + ((item.priceUnit || 0) * item.quantity), 0) || 0
    const totalAfterDiscount = subtotal - remise
    const finalTotal = totalAfterDiscount + commission

    const [clientSearch, setClientSearch] = useState("")
    const [clients, setClients] = useState([])
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [clientModalOpen, setClientModalOpen] = useState(false)

    const fetchClients = async () => {
        const res = await fetch("/api/clients")
        if (res.ok) setClients(await res.json())
    }
    useEffect(() => { fetchClients() }, [])

    const handleAddToCart = () => {
        if (!currentProductId) {
            toast.error("Veuillez sélectionner un produit")
            return
        }

        const product = products.find((p: any) => p.id === Number(currentProductId)) as any
        if (!product) return

        if ((product.stockLevels?.find((sl: any) => sl.warehouseId === 1)?.quantity ?? 0) < currentQuantity) {
            toast.error(`Stock insuffisant pour "${product.name}"`)
            return
        }

        const existing = items.findIndex((item: any) => item.productId === Number(currentProductId))
        if (existing > -1) {
            toast.error("Ce produit est déjà dans le panier")
            return
        }

        append({
            productId: Number(currentProductId),
            quantity: currentQuantity,
            designation: product.name,
            priceUnit: product.salePrice,
            discount: 0,
        })

        setCurrentProductId("")
        setCurrentQuantity(1)
    }

    const resetForm = () => {
        reset({ items: [] })
        setRemise(0)
        setCommission(0)
        setSelectedClient(null)
        setPaymentMethod("ESPECES")
        setLastSale(null)
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
                body: JSON.stringify({
                    items: values.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        designation: item.designation,
                        priceUnit: item.priceUnit,
                        discount: item.discount || 0,
                    })),
                    remise,
                    commission,
                    paymentMethod,
                    clientId: selectedClient?.id || null,
                }),
            })
            if (!res.ok) {
                const errText = await res.text()
                throw new Error(errText || "Erreur serveur")
            }
            const saleData = await res.json()

            setLastSale({
                id: saleData.transactionId,
                items: saleData.items.map((item: any) => ({
                    designation: item.designation,
                    quantity: item.quantity,
                    priceUnit: item.priceUnit,
                })),
                client: selectedClient?.name || "Client comptant",
                date: new Date(saleData.saleDate).toLocaleDateString("fr-FR"),
                total: saleData.totalTtc,
                discount: saleData.discount,
                paidAmount: saleData.paidAmount,
                logoUrl: settings?.logoUrl,
            })

            toast.success("Vente enregistrée avec succès")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreditSale = async () => {
        const values = watch()
        if (values.items.length === 0) {
            toast.error("Le panier est vide")
            return
        }
        if (!selectedClient) {
            toast.error("Sélectionnez un client pour un crédit")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/debts", {
                method: "POST",
                body: JSON.stringify({
                    items: values.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        designation: item.designation,
                        priceUnit: item.priceUnit,
                    })),
                    clientId: selectedClient.id,
                    total: finalTotal,
                    notes: `Vente à crédit du ${new Date().toLocaleDateString("fr-FR")}`,
                }),
            })

            if (!res.ok) {
                const errText = await res.text()
                throw new Error(errText || "Erreur serveur")
            }

            toast.success("Vente à crédit enregistrée !")
            window.location.href = "/debts"
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (lastSale) {
        return (
            <div className="space-y-6">
                <Receipt
                    data={{
                        title: "Reçu de Vente",
                        reference: lastSale.id,
                        items: lastSale.items,
                        client: lastSale.client,
                        date: lastSale.date,
                        total: lastSale.total,
                        discount: lastSale.discount,
                        paidAmount: lastSale.paidAmount,
                        logoUrl: lastSale.logoUrl,
                        footerMessage: "Merci pour votre achat !",
                        paymentMethod,
                    }}
                />
                <div className="text-center print:hidden">
                    <Button variant="ghost" onClick={resetForm} className="rounded-xl">
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
                    <ShoppingBag className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Nouvelle Vente</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Product Selection */}
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
                                    <span>{selectedProduct.salePrice.toLocaleString()} F</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm">
                                    <span>Sous-total:</span>
                                    <span className="text-primary">{(selectedProduct.salePrice * currentQuantity).toLocaleString()} F</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Stock boutique:</span>
                                    <span className={selectedProduct.stockLevels?.find((sl: any) => sl.warehouseId === 1)?.quantity <= selectedProduct.stockMin ? "text-red-500 font-bold" : ""}>
                                        {selectedProduct.stockLevels?.find((sl: any) => sl.warehouseId === 1)?.quantity ?? 0}
                                    </span>
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

                    {/* Cart & Client */}
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
                                    <div className="border rounded-2xl overflow-x-auto">
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
                                                        <td className="p-4 text-center">{(field.priceUnit || 0).toLocaleString()} F</td>
                                                        <td className="p-4 text-center">
                                                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold">x{field.quantity}</span>
                                                        </td>
                                                        <td className="p-4 text-right font-bold text-primary">
                                                            {((field.priceUnit || 0) * (field.quantity || 0)).toLocaleString()} F
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 rounded-full">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}
                            </div>

                            {/* Payment summary */}
                            <div className="bg-muted/20 rounded-2xl p-6 space-y-2 border">
                                <div className="flex justify-between text-sm">
                                    <span>Sous-total</span>
                                    <span className="font-mono">{subtotal.toLocaleString()} F</span>
                                </div>
                                {remise > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Remise</span>
                                        <span className="font-mono">-{remise.toLocaleString()} F</span>
                                    </div>
                                )}
                                {commission > 0 && (
                                    <div className="flex justify-between text-sm text-orange-600">
                                        <span>Commission</span>
                                        <span className="font-mono">+{commission.toLocaleString()} F</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg border-t pt-2 text-primary">
                                    <span>Total à payer</span>
                                    <span className="font-mono">{finalTotal.toLocaleString()} F</span>
                                </div>
                            </div>

                            {/* Client Selection */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4" /> Client
                                </h3>
                                <div className="relative">
                                    <Input
                                        placeholder="Rechercher un client..."
                                        value={clientSearch}
                                        onChange={async (e) => {
                                            setClientSearch(e.target.value)
                                            if (e.target.value.length < 2) return
                                            const res = await fetch(`/api/clients?search=${e.target.value}`)
                                            if (res.ok) setClients(await res.json())
                                        }}
                                        className="rounded-xl h-11"
                                    />
                                    {clientSearch && clients.length > 0 && (
                                        <div className="absolute z-10 mt-1 w-full bg-background border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                            {clients.filter((c: any) =>
                                                c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                                c.phone?.includes(clientSearch)
                                            ).map((client: any) => (
                                                <button
                                                    key={client.id}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm transition-colors"
                                                    onClick={() => {
                                                        setSelectedClient(client)
                                                        setClientSearch(client.name)
                                                    }}
                                                >
                                                    {client.name} {client.phone && <span className="text-xs text-muted-foreground">- {client.phone}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedClient && (
                                    <div className="flex items-center justify-between bg-primary/5 rounded-xl px-4 py-2">
                                        <span className="text-sm font-medium">{selectedClient.name}</span>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedClient(null); setClientSearch("") }} className="text-xs rounded-lg h-7">
                                            Changer
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-3 pt-4 border-t">
                                <Label className="text-muted-foreground text-xs uppercase flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> Mode de paiement
                                </Label>
                                <div className="flex gap-2 flex-wrap">
                                    {["ESPECES", "CARTE", "MOBILE_MONEY", "VIREMENT", "CHEQUE"].map((method) => (
                                        <Button
                                            key={method}
                                            type="button"
                                            variant={paymentMethod === method ? "default" : "outline"}
                                            className={`rounded-xl text-xs px-4 ${paymentMethod === method ? "shadow-md" : ""}`}
                                            onClick={() => setPaymentMethod(method)}
                                        >
                                            {method === "ESPECES" ? "Espèces" :
                                             method === "CARTE" ? "Carte" :
                                             method === "MOBILE_MONEY" ? "Mobile Money" :
                                             method === "VIREMENT" ? "Virement" : "Chèque"}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Financial Adjustments */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs uppercase">Remise (F)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={remise}
                                        onChange={(e) => setRemise(Number(e.target.value))}
                                        className="rounded-xl h-11 font-mono"
                                        min="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs uppercase">Commission (F)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={commission}
                                        onChange={(e) => setCommission(Number(e.target.value))}
                                        className="rounded-xl h-11 font-mono"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <Button
                                    type="button"
                                    onClick={handleCreditSale}
                                    disabled={loading || fields.length === 0}
                                    className="flex-1 h-14 rounded-xl text-base font-bold shadow-lg bg-orange-500 text-white hover:bg-orange-600 transition-all active:scale-[0.98]"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Vendre à Crédit"}
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={loading || fields.length === 0}
                                    className="flex-1 h-14 rounded-xl text-base font-bold shadow-lg transition-all active:scale-[0.98]"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Payer & Reçu"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
