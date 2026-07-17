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
import { ShoppingBag, User, Hash, Loader2, Plus, Trash2, ShoppingCart, Monitor, Printer, HardDrive, Smartphone, Wifi, Package, MonitorCheck } from "lucide-react"
import { Receipt } from "./receipt"
import { ProductCatalog } from "./ProductCatalog"

type SaleFormValues = z.infer<typeof saleSchema>

export function SaleForm() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [lastSale, setLastSale] = useState<any>(null)

  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map())
  const [remise, setRemise] = useState(0)
  const [commission, setCommission] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(res => res.json()),
      fetch("/api/categories").then(res => res.json()),
      fetch("/api/settings").then(res => res.json()).catch(() => {})
    ]).then(([productsData, categoriesData, settingsData]) => {
      const transformedProducts = productsData.map((prod: any) => ({
        id: prod.id,
        designation: prod.name,
        quantite: prod.stockLevels?.find((sl: any) => sl.warehouseId === 1)?.quantity ?? 0,
        prixUnitaire: prod.salePrice,
        categorieId: prod.categoryId,
        categorie: prod.category ? { id: prod.category.id, nom: prod.category.name } : null
      }))
      setProducts(transformedProducts)
      setCategories(categoriesData)
      if (settingsData) setSettings(settingsData)
    })
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
  const subtotal = items?.reduce((sum, item) => sum + ((item.prixUnitaire || 0) * item.quantite), 0) || 0
  const totalAmount = subtotal - remise + commission

  useEffect(() => {
    const newMap = new Map<string, number>()
    items.forEach((item: any) => {
      newMap.set(String(item.produitId), item.quantite)
    })
    setSelectedProducts(newMap)
  }, [items])

  const handleToggleProduct = (productId: string, quantity: number) => {
    const product = products.find((p: any) => p.id === Number(productId)) as any
    if (!product) return

    if (quantity === 0) {
      const existingIndex = items.findIndex((item: any) => item.produitId === Number(productId))
      if (existingIndex > -1) {
        remove(existingIndex)
      }
    } else {
      if (product.quantite < quantity) {
        toast.error("Stock insuffisant")
        return
      }

      const existingIndex = items.findIndex((item: any) => item.produitId === Number(productId))
      if (existingIndex > -1) {
        remove(existingIndex)
      }

      append({
        produitId: Number(productId),
        quantite: quantity,
        designation: product.designation,
        prixUnitaire: product.prixUnitaire
      })
    }
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
            productId: item.produitId,
            quantity: item.quantite,
            designation: item.designation,
            priceUnit: item.prixUnitaire
          })),
          remise,
          commission,
          paymentMethod: "ESPECES"
        }),
        headers: { "Content-Type": "application/json" }
      })

      if (!res.ok) throw new Error(await res.text())

      const saleData = await res.json()
      const transactionId = saleData[0]?.transactionId

      setLastSale({
        id: transactionId,
        items: values.items.map(item => ({
          designation: item.designation!,
          quantity: item.quantite,
          priceUnit: item.prixUnitaire!,
        })),
        client: `${values.nomClient || ""} ${values.prenomClient || ""}`.trim(),
        date: new Date().toLocaleDateString(),
        logoUrl: settings?.logoUrl
      })

      toast.success("Vente enregistrée avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement de la vente")
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
            total: lastSale.items.reduce((sum: number, item: any) => sum + (item.priceUnit * item.quantity), 0),
            logoUrl: lastSale.logoUrl,
            footerMessage: "Merci pour votre achat !"
          }}
        />
        <div className="text-center print:hidden">
          <Button variant="ghost" onClick={() => setLastSale(null)} className="rounded-xl">
            Effectuer une autre vente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-background p-8 rounded-2xl shadow-sm border space-y-8">
        <div className="flex items-center gap-3 text-primary mb-4 border-b pb-4">
          <ShoppingBag className="w-6 h-6" />
          <h2 className="text-xl font-bold">Nouvelle Vente</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 bg-muted/30 p-6 rounded-2xl border border-dashed">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Sélectionner des produits
            </h3>

            <ProductCatalog
              products={products}
              categories={categories}
              selectedProducts={selectedProducts}
              onToggleProduct={handleToggleProduct}
            />
          </div>

          <div className="lg:col-span-1 space-y-4">
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <ShoppingCart className="w-3 h-3" />
                  Panier ({fields.length})
                </h3>

                {fields.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed rounded-xl text-xs text-muted-foreground bg-muted/10">
                    Panier vide
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-x-auto custom-scrollbar">
                    <table className="w-full text-xs min-w-[200px]">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left p-2 font-medium text-muted-foreground uppercase text-[9px]">Désignation</th>
                          <th className="text-center p-2 font-medium text-muted-foreground uppercase text-[9px]">Qté</th>
                          <th className="text-right p-2 font-medium text-muted-foreground uppercase text-[9px]">Total</th>
                          <th className="p-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => (
                          <tr key={field.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-2 font-medium truncate max-w-[80px]">{field.designation}</td>
                            <td className="p-2 text-center">
                              <span className="bg-primary/10 text-primary px-1 py-0.5 rounded text-[10px] font-bold">
                                x{field.quantite}
                              </span>
                            </td>
                            <td className="p-2 text-right font-bold text-primary text-[11px]">
                              {((field.prixUnitaire || 0) * (field.quantite || 0)).toLocaleString()} F
                            </td>
                            <td className="p-1 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="text-destructive hover:bg-destructive/10 rounded-full h-6 w-6"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-primary/5 font-bold">
                          <td colSpan={2} className="p-2 text-right text-[10px]">TOTAL :</td>
                          <td className="p-2 text-right text-sm text-primary">{totalAmount.toLocaleString()} F</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {errors.items && <p className="text-xs text-destructive">{errors.items.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2 border-t">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground uppercase">Nom</Label>
                  <Input {...register("nomClient")} placeholder="Nom" className="rounded-lg h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground uppercase">Téléphone</Label>
                  <Input {...register("numeroClient")} placeholder="Tel" className="rounded-lg h-8 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground uppercase">Remise</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={remise}
                    onChange={(e) => setRemise(Number(e.target.value))}
                    className="rounded-lg h-8 text-xs font-mono"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground uppercase">Commission</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value))}
                    className="rounded-lg h-8 text-xs font-mono"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault()
                    const values = watch()

                    if (values.items.length === 0) {
                      toast.error("Le panier est vide")
                      return
                    }
                    if (!values.nomClient || !values.numeroClient) {
                      toast.error("Nom et Téléphone obligatoires pour un crédit")
                      return
                    }

                    setLoading(true)
                    try {
                      const res = await fetch("/api/debts", {
                        method: "POST",
                        body: JSON.stringify({
                          items: values.items.map(item => ({
                            productId: item.produitId,
                            quantity: item.quantite,
                            designation: item.designation,
                            priceUnit: item.prixUnitaire
                          })),
                          nomClient: values.nomClient,
                          prenomClient: values.prenomClient,
                          telephone: values.numeroClient,
                          total: totalAmount
                        }),
                        headers: { "Content-Type": "application/json" }
                      })

                      if (!res.ok) throw new Error(await res.text())

                      toast.success("Vente à crédit enregistrée !")
                      window.location.href = "/debts"
                    } catch (error: any) {
                      toast.error(error.message)
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading || fields.length === 0}
                  className="h-10 rounded-lg text-xs font-bold shadow-lg bg-orange-500 text-white hover:bg-orange-600 transition-all active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin mr-1" /> : "Crédit"}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || fields.length === 0}
                  className="h-10 rounded-lg text-xs font-bold shadow-lg bg-primary text-white hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin mr-1" /> : "Payer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
