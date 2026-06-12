"use client"

import { useEffect, useState } from "react"
import { Search, Plus, Loader2, Truck, Eye, FileText, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function PurchasesPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [suppliers, setSuppliers] = useState([])
    const [products, setProducts] = useState([])

    const [formData, setFormData] = useState({
        supplierId: "",
        notes: "",
        items: [] as { productId: string; quantity: string; priceUnit: string; discount: string }[],
    })

    useEffect(() => {
        fetchOrders()
        fetchSuppliers()
        fetchProducts()
    }, [])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/purchases")
            if (res.ok) {
                const data = await res.json()
                setOrders(data)
            }
        } catch (error) {
            toast.error("Erreur lors du chargement des commandes")
        } finally {
            setLoading(false)
        }
    }

    const fetchSuppliers = async () => {
        try {
            const res = await fetch("/api/suppliers")
            if (res.ok) setSuppliers(await res.json())
        } catch (error) { }
    }

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products")
            if (res.ok) setProducts(await res.json())
        } catch (error) { }
    }

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { productId: "", quantity: "1", priceUnit: "0", discount: "0" }],
        }))
    }

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }))
    }

    const updateItem = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newItems = [...prev.items]
            newItems[index] = { ...newItems[index], [field]: value }
            return { ...prev, items: newItems }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.supplierId || formData.items.length === 0) {
            toast.error("Veuillez sélectionner un fournisseur et ajouter au moins un article")
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch("/api/purchases", {
                method: "POST",
                body: JSON.stringify({
                    supplierId: Number(formData.supplierId),
                    notes: formData.notes,
                    items: formData.items.map(item => ({
                        productId: Number(item.productId),
                        quantity: Number(item.quantity),
                        priceUnit: Number(item.priceUnit),
                        discount: Number(item.discount),
                    })),
                })
            })
            if (!res.ok) {
                const err = await res.text()
                throw new Error(err || "Erreur lors de la création")
            }
            toast.success("Commande créée avec succès")
            fetchOrders()
            setIsAddDialogOpen(false)
            setFormData({ supplierId: "", notes: "", items: [] })
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "BROUILLON":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground"><Clock className="w-3 h-3" /> Brouillon</span>
            case "COMMANDE":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><FileText className="w-3 h-3" /> Commandé</span>
            case "RECU":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Reçu</span>
            case "ANNULE":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Annulé</span>
            default:
                return null
        }
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Gestion des Achats</h2>
                    <p className="text-muted-foreground">Commandes fournisseurs et approvisionnements.</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                            <Plus className="w-4 h-4" />
                            Nouvelle Commande
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Nouvelle Commande Fournisseur</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                            <div className="grid gap-2">
                                <Label>Fournisseur *</Label>
                                <Select value={formData.supplierId} onValueChange={v => setFormData({ ...formData, supplierId: v })}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Sélectionner un fournisseur" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {suppliers.map((s: any) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-bold">Articles</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="rounded-xl gap-1">
                                        <Plus className="w-3 h-3" /> Ajouter
                                    </Button>
                                </div>

                                {formData.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 bg-muted/30 rounded-xl">
                                        <div className="col-span-4">
                                            <Label className="text-xs">Produit</Label>
                                            <Select value={item.productId} onValueChange={v => updateItem(index, "productId", v)}>
                                                <SelectTrigger className="rounded-xl h-10 text-sm">
                                                    <SelectValue placeholder="Produit" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {products.map((p: any) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>{p.designation}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-xs">Qté</Label>
                                            <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(index, "quantity", e.target.value)} className="rounded-xl h-10" />
                                        </div>
                                        <div className="col-span-3">
                                            <Label className="text-xs">Prix Unit.</Label>
                                            <Input type="number" min="0" value={item.priceUnit} onChange={e => updateItem(index, "priceUnit", e.target.value)} className="rounded-xl h-10" />
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-xs">Remise %</Label>
                                            <Input type="number" min="0" max="100" value={item.discount} onChange={e => updateItem(index, "discount", e.target.value)} className="rounded-xl h-10" />
                                        </div>
                                        <div className="col-span-1">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="rounded-xl text-destructive h-10 w-full">
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Input placeholder="Notes éventuelles" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="rounded-xl" />
                            </div>

                            <Button type="submit" disabled={submitting} className="w-full rounded-xl font-bold h-12">
                                {submitting ? <Loader2 className="animate-spin mr-2" /> : "Créer la commande"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-background rounded-3xl shadow-sm border p-8 space-y-8">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input placeholder="Rechercher par fournisseur..." className="pl-12 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary" />
                </div>

                <div className="rounded-2xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                <TableHead className="pl-8 py-5">N° Commande</TableHead>
                                <TableHead className="py-5">Fournisseur</TableHead>
                                <TableHead className="py-5">Date</TableHead>
                                <TableHead className="py-5 text-right">Total</TableHead>
                                <TableHead className="py-5 text-center">Statut</TableHead>
                                <TableHead className="text-right pr-8 py-5">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20" />
                                        Chargement...
                                    </TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                                        Aucune commande trouvée.
                                    </TableCell>
                                </TableRow>
                            ) : orders.map((order: any) => (
                                <TableRow key={order.id} className="hover:bg-muted/10 transition-colors group">
                                    <TableCell className="pl-8 py-4 font-mono font-bold text-sm">
                                        #CMD-{String(order.id).padStart(4, "0")}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <Truck size={16} className="text-muted-foreground" />
                                            <span className="font-medium">{order.supplier?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                        {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: fr })}
                                    </TableCell>
                                    <TableCell className="py-4 text-right font-mono font-bold">
                                        {order.totalHt.toLocaleString()} F
                                    </TableCell>
                                    <TableCell className="py-4 text-center">
                                        {getStatusBadge(order.status)}
                                    </TableCell>
                                    <TableCell className="text-right pr-8 py-4">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setSelectedOrder(order)
                                                setIsDetailDialogOpen(true)
                                            }}
                                            className="rounded-xl text-muted-foreground hover:text-primary"
                                        >
                                            <Eye className="w-4 h-4 mr-1" /> Détails
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <Truck className="w-6 h-6 text-primary" />
                            Détails de la Commande
                        </DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-6 mt-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Fournisseur</p>
                                    <p className="font-bold">{selectedOrder.supplier?.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedOrder.supplier?.phone}</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Statut</p>
                                    <div>{getStatusBadge(selectedOrder.status)}</div>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(selectedOrder.orderDate), "dd MMMM yyyy", { locale: fr })}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Articles</h3>
                                <div className="rounded-xl border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="font-bold">Produit</TableHead>
                                                <TableHead className="font-bold text-right">Qté</TableHead>
                                                <TableHead className="font-bold text-right">Prix unit.</TableHead>
                                                <TableHead className="font-bold text-right">Remise</TableHead>
                                                <TableHead className="font-bold text-right">Sous-total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedOrder.items?.map((item: any) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.product?.designation}</TableCell>
                                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                                    <TableCell className="text-right font-mono">{item.priceUnit.toLocaleString()} F</TableCell>
                                                    <TableCell className="text-right">{item.discount}%</TableCell>
                                                    <TableCell className="text-right font-mono font-bold">{item.subtotal.toLocaleString()} F</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <div className="p-4 bg-primary/5 rounded-xl">
                                    <p className="text-sm text-muted-foreground">Total de la commande</p>
                                    <p className="text-2xl font-black text-primary">{selectedOrder.totalHt.toLocaleString()} F</p>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="p-4 bg-muted/20 rounded-xl">
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Notes</p>
                                    <p className="text-sm italic">{selectedOrder.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
