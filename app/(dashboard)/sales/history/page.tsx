"use client"

import { useEffect, useState } from "react"
import { Search, History, Loader2, Eye, FileText, Printer } from "lucide-react"
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
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { Receipt } from "@/components/sales/receipt"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SalesHistoryPage() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedSale, setSelectedSale] = useState<any>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [receiptData, setReceiptData] = useState<any>(null)
    const [settings, setSettings] = useState<any>(null)

    useEffect(() => {
        fetchSales()
        fetch("/api/settings").then(res => res.json()).then(setSettings)
    }, [])

    const fetchSales = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/sales")
            if (res.ok) {
                const data = await res.json()
                setSales(data)
            }
        } catch (error) {
            toast.error("Erreur lors du chargement")
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAYEE":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Payée</span>
            case "DETTE":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Dette</span>
            case "PARTIELLE":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Partielle</span>
            case "ANNULEE":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Annulée</span>
            default:
                return null
        }
    }

    const handlePrintReceipt = (sale: any) => {
        const totalItems = sale.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0
        setReceiptData({
            title: "Reçu de Vente",
            subtitle: `Transaction #${sale.transactionId || sale.id}`,
            date: format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm"),
            items: sale.items?.map((i: any) => ({
                designation: i.designation,
                quantity: i.quantity,
                priceUnit: i.priceUnit,
            })) || [],
            total: sale.totalTtc,
            extraInfo: [
                { label: "Remise", value: `${sale.discount.toLocaleString()} F` },
                { label: "Mode Paiement", value: sale.paymentMethod || "Espèces" },
                { label: "Articles", value: `${totalItems} pièce(s)` },
            ],
            logoUrl: settings?.logoUrl,
        })
    }

    const filteredSales = sales.filter((s: any) => {
        const searchLower = searchTerm.toLowerCase()
        const transactionLower = (s.transactionId ?? "").toLowerCase()
        const hasMatchingItem = s.items?.some((i: any) => (i.designation ?? "").toLowerCase().includes(searchLower))
        
        return transactionLower.includes(searchLower) || hasMatchingItem
    })

    const todaySales = sales.filter((s: any) =>
        format(new Date(s.saleDate), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
    )
    const todayTotal = todaySales.reduce((acc: number, s: any) => acc + s.totalTtc, 0)
    const totalSales = sales.reduce((acc: number, s: any) => acc + s.totalTtc, 0)

    if (receiptData) {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between print:hidden">
                    <h2 className="text-2xl font-black tracking-tight">Reçu de Vente</h2>
                    <Button variant="outline" onClick={() => setReceiptData(null)} className="rounded-xl gap-2">
                        <History className="w-4 h-4" /> Retour
                    </Button>
                </div>
                <Receipt data={receiptData} />
                <div className="text-center print:hidden pt-8">
                    <Button variant="ghost" onClick={() => setReceiptData(null)} className="rounded-xl text-muted-foreground hover:text-primary">
                        Fermer
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Historique des Ventes</h2>
                    <p className="text-muted-foreground">Consultez toutes les ventes effectuées.</p>
                </div>
                <Button onClick={fetchSales} className="rounded-xl font-bold gap-2">
                    <History className="w-4 h-4" /> Actualiser
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl shadow-none border bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Aujourd'hui</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-emerald-900">{todayTotal.toLocaleString()} F</p>
                        <p className="text-xs text-emerald-600">{todaySales.length} vente(s)</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-none border bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-blue-700 uppercase tracking-widest">Total Général</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-blue-900">{totalSales.toLocaleString()} F</p>
                        <p className="text-xs text-blue-600">{sales.length} vente(s)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-background rounded-3xl shadow-sm border p-8 space-y-8">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par transaction ou produit..."
                        className="pl-12 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="rounded-2xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                <TableHead className="pl-8 py-5">Transaction</TableHead>
                                <TableHead className="py-5">Date</TableHead>
                                <TableHead className="py-5">Articles</TableHead>
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
                            ) : filteredSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                                        Aucune vente trouvée.
                                    </TableCell>
                                </TableRow>
                            ) : filteredSales.map((sale: any) => (
                                <TableRow key={sale.id} className="hover:bg-muted/10 transition-colors group">
                                    <TableCell className="pl-8 py-4">
                                        <span className="font-mono font-bold text-sm">
                                            {sale.transactionId || `#V${String(sale.id).padStart(4, "0")}`}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                        {format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm", { locale: fr })}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-sm">{sale.items?.length || 0} article(s)</span>
                                    </TableCell>
                                    <TableCell className="py-4 text-right font-mono font-bold">
                                        {sale.totalTtc.toLocaleString()} F
                                    </TableCell>
                                    <TableCell className="py-4 text-center">
                                        {getStatusBadge(sale.status)}
                                    </TableCell>
                                    <TableCell className="text-right pr-8 py-4 space-x-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setSelectedSale(sale)
                                                setIsDetailOpen(true)
                                            }}
                                            className="rounded-xl"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handlePrintReceipt(sale)}
                                            className="rounded-xl"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Détails de la Vente</DialogTitle>
                    </DialogHeader>
                    {selectedSale && (
                        <div className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">Transaction</p>
                                    <p className="font-bold font-mono">{selectedSale.transactionId || `#V${selectedSale.id}`}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Date</p>
                                    <p className="font-medium">{format(new Date(selectedSale.saleDate), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Paiement</p>
                                    <p className="font-medium">{selectedSale.paymentMethod || "Espèces"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Statut</p>
                                    <div>{getStatusBadge(selectedSale.status)}</div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Articles</p>
                                <div className="space-y-2">
                                    {selectedSale.items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span>{item.designation} x{item.quantity}</span>
                                            <span className="font-mono font-medium">{(item.priceUnit * item.quantity).toLocaleString()} F</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4 flex justify-between items-center">
                                <span className="font-bold">Total</span>
                                <span className="font-black text-lg text-primary">{selectedSale.totalTtc.toLocaleString()} F</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
