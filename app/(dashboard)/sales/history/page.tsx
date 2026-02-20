"use client"

import { useEffect, useState, useMemo } from "react"
import { Search, Calendar, FileText, ChevronRight, Eye, Download, TrendingUp, ShoppingBag, User, Info, CreditCard, Printer, History } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Receipt } from "@/components/sales/receipt"
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
} from "@/components/ui/dialog"
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, isSameMonth, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { formatCompactNumber, cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Pagination } from "@/components/ui/pagination"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HistoryPage() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [mounted, setMounted] = useState(false)
    const [selectedSale, setSelectedSale] = useState<any>(null)
    const [expenses, setExpenses] = useState(0)
    const [searchMounted, setSearchMounted] = useState(false)
    const [receiptData, setReceiptData] = useState<any>(null)

    // pagination
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    useEffect(() => setPage(1), [searchTerm, startDate, endDate, pageSize, sales])

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSales()
        }, searchMounted ? 500 : 0)

        if (!searchMounted) setSearchMounted(true)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm, startDate, endDate])

    const fetchSales = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (searchTerm) params.append("query", searchTerm)
            if (startDate) params.append("startDate", startDate)
            if (endDate) params.append("endDate", endDate)

            const [salesRes, expensesRes] = await Promise.all([
                fetch(`/api/sales/history?${params.toString()}`),
                fetch(`/api/expenses?${params.toString()}`)
            ])

            const salesData = await salesRes.json()
            setSales(salesData)

            if (expensesRes.ok) {
                const expensesData = await expensesRes.json()
                const totalExpenses = expensesData.reduce((sum: number, exp: any) => sum + exp.montant, 0)
                setExpenses(totalExpenses)
            }
        } catch (error) {
            console.error("Failed to fetch sales history", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredSales = useMemo(() => {
        return sales // Filtering is handled by the API now for performance
    }, [sales])

    const displayedSales = filteredSales.slice((page - 1) * pageSize, page * pageSize)

    const stats = useMemo(() => {
        const total = filteredSales.reduce((sum, sale: any) => sum + sale.total, 0)
        const count = filteredSales.length
        const margin = total - expenses
        return { total, count, margin }
    }, [filteredSales, expenses])

    const handleExport = () => {
        const headers = ["ID Transaction", "Type", "Date", "Client", "Produits", "Montant Total"]
        const rows = filteredSales.map((s: any) => [
            s.transactionId,
            s.type === "VERSEMENT_DETTE" ? "Réglement Dette" : "Vente",
            format(new Date(s.date), "dd/MM/yyyy HH:mm"),
            s.nomClient || "Client Comptoir",
            s.items.map((i: any) => `${i.designation} (x${i.quantite})`).join(" | "),
            s.total
        ])

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `rapport-ventes-${format(new Date(), "yyyy-MM-dd")}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleRePrint = (sale: any) => {
        const isDebt = sale.type === "VERSEMENT_DETTE"

        setReceiptData({
            title: isDebt ? "Reçu de Paiement" : "Reçu de Vente",
            reference: sale.transactionId,
            items: sale.items,
            client: sale.nomClient || "Client Comptoir",
            date: format(new Date(sale.date), "dd/MM/yyyy HH:mm"),
            total: sale.total,
            footerMessage: isDebt ? "Merci pour votre paiement !" : "Merci pour votre achat !",
            extraInfo: isDebt ? [
                { label: "Type", value: "Règlement de dette" },
                { label: "Note", value: sale.note || "N/A" }
            ] : undefined
        })
    }

    if (receiptData) {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between print:hidden">
                    <h2 className="text-2xl font-black tracking-tight">Réimpression du Reçu</h2>
                    <Button
                        variant="outline"
                        onClick={() => setReceiptData(null)}
                        className="rounded-xl gap-2"
                    >
                        <History className="w-4 h-4" /> Retour à l'historique
                    </Button>
                </div>

                <Receipt data={receiptData} />

                <div className="text-center print:hidden pt-8">
                    <Button
                        variant="ghost"
                        onClick={() => setReceiptData(null)}
                        className="rounded-xl text-muted-foreground hover:text-primary"
                    >
                        Fermer et retourner à la liste
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header section with Stats Cards */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Gestion des Ventes</h2>
                    <p className="text-muted-foreground">Pilotez votre activité et consultez les détails de chaque transaction.</p>
                </div>
                <Button
                    onClick={handleExport}
                    className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
                >
                    <Download className="w-4 h-4" />
                    Exporter Rapport
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl shadow-none border border-border bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            Total Filtré
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-3.5 h-3.5 text-blue-600/50 hover:text-blue-600 cursor-help transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                    Montant total cumulé de toutes les transactions sur la période sélectionnée.
                                </TooltipContent>
                            </Tooltip>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-blue-900">{stats.total.toLocaleString()} F</p>
                        <p className="text-xs text-blue-600 mt-1">Chiffre d'affaires</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-none border border-border bg-amber-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                            <ShoppingBag className="w-4 h-4" />
                            Ventes
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-3.5 h-3.5 text-amber-600/50 hover:text-amber-600 cursor-help transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                    Nombre total de transactions (ventes groupées) enregistrées sur la période.
                                </TooltipContent>
                            </Tooltip>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-amber-900">{stats.count}</p>
                        <p className="text-xs text-amber-600 mt-1">Nombre d'opérations</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-none border border-border bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            Marge Nette
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-3.5 h-3.5 text-emerald-600/50 hover:text-emerald-600 cursor-help transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                    Ventes totales moins dépenses (salaires, commissions, frais). Représente votre bénéfice réel.
                                </TooltipContent>
                            </Tooltip>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-emerald-900">{Math.round(stats.margin).toLocaleString()} F</p>
                        <p className="text-xs text-emerald-600 mt-1">Profit estimé</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-background rounded-3xl shadow-sm border p-8 space-y-8">
                {/* Filters Row */}
                <div className="flex flex-col md:flex-row items-end gap-6">
                    <div className="relative flex-[2]">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4 mb-2 block">Recherche</label>
                        <Search className="absolute left-4 top-[calc(50%+10px)] -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Client ou ID transaction..."
                            className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative flex-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4 mb-2 block">Du</label>
                        <Calendar className="absolute left-4 top-[calc(50%+10px)] -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            type="date"
                            className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary text-base"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="relative flex-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4 mb-2 block">Au</label>
                        <Calendar className="absolute left-4 top-[calc(50%+10px)] -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            type="date"
                            className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary text-base"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={fetchSales}
                        className="h-14 px-8 rounded-2xl font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02]"
                    >
                        Filtrer
                    </Button>
                </div>

                <div className="rounded-2xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="py-5 font-bold text-xs uppercase tracking-wider pl-8">Vente ID</TableHead>
                                <TableHead className="py-5 font-bold text-xs uppercase tracking-wider">Date & Heure</TableHead>
                                <TableHead className="py-5 font-bold text-xs uppercase tracking-wider">Client</TableHead>
                                <TableHead className="py-5 font-bold text-xs uppercase tracking-wider">Produits</TableHead>
                                <TableHead className="py-5 font-bold text-xs uppercase tracking-wider text-right pr-8">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                            Chargement des données...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center text-muted-foreground italic">
                                        Aucune vente trouvée pour ces critères.
                                    </TableCell>
                                </TableRow>
                            ) : displayedSales.map((sale: any) => (
                                <Dialog key={sale.transactionId}>
                                    <DialogTrigger asChild>
                                        <TableRow
                                            className="cursor-pointer hover:bg-muted/30 transition-colors group"
                                            onClick={() => setSelectedSale(sale)}
                                        >
                                            <TableCell className="py-5 font-mono text-sm pl-8">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-primary font-bold">{sale.transactionId}</span>
                                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    {sale.type === "VERSEMENT_DETTE" && (
                                                        <Badge variant="outline" className="w-fit text-[9px] font-black border-emerald-200 bg-emerald-50 text-emerald-700 uppercase tracking-tighter px-1.5 py-0">
                                                            Règlement Dette
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <p className="font-semibold">{mounted && format(new Date(sale.date), "dd MMMM yyyy", { locale: fr })}</p>
                                                <p className="text-xs text-muted-foreground">{mounted && format(new Date(sale.date), "HH:mm")}</p>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase",
                                                        sale.type === "VERSEMENT_DETTE" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {(sale.nomClient || "Client").substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{sale.nomClient || "Client Comptoir"}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase">{sale.numeroClient || "Sans contact"}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-tighter",
                                                        sale.type === "VERSEMENT_DETTE" ? "bg-emerald-50 text-emerald-600" : "bg-primary/5 text-primary"
                                                    )}>
                                                        {sale.items.length} produit{sale.items.length > 1 ? 's' : ''}
                                                    </div>
                                                    <p className="text-sm truncate max-w-[200px] text-muted-foreground">
                                                        {sale.items[0]?.designation || "Règlement"} {sale.items.length > 1 ? '...' : ''}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-right pr-8">
                                                <span className={cn(
                                                    "text-lg font-black tracking-tight",
                                                    sale.type === "VERSEMENT_DETTE" ? "text-emerald-600" : ""
                                                )}>
                                                    {sale.total.toLocaleString()} F
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 border-none shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        <DialogHeader className="sticky top-0 bg-background/80 backdrop-blur-md pb-4 z-10 border-b mb-6">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                                                sale.type === "VERSEMENT_DETTE" ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
                                            )}>
                                                {sale.type === "VERSEMENT_DETTE" ? <CreditCard className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                                            </div>
                                            <DialogTitle className="text-2xl font-black">
                                                {sale.type === "VERSEMENT_DETTE" ? "Détails du Règlement" : "Détails de la Vente"}
                                            </DialogTitle>
                                            <div className="flex flex-wrap gap-4 mt-2">
                                                <div className="px-3 py-1 bg-muted rounded-full text-xs font-bold text-muted-foreground">
                                                    ID: {sale.transactionId}
                                                </div>
                                                <div className="px-3 py-1 bg-muted rounded-full text-xs font-bold text-muted-foreground">
                                                    {mounted && format(new Date(sale.date), "dd/MM/yyyy HH:mm")}
                                                </div>
                                                {sale.type === "VERSEMENT_DETTE" && (
                                                    <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                                                        Règlement Dette
                                                    </Badge>
                                                )}
                                            </div>
                                            {sale.note && (
                                                <div className="mt-4 p-4 bg-muted/50 rounded-xl text-sm italic text-muted-foreground border-l-4 border-primary">
                                                    "{sale.note}"
                                                </div>
                                            )}
                                        </DialogHeader>

                                        <div className="mt-8 space-y-8">
                                            {/* Client Info */}
                                            <div className="p-6 rounded-2xl bg-muted/30 border space-y-4">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Client</h4>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-black text-xl">
                                                        {(sale.nomClient || "C").substring(0, 1)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg">{sale.nomClient || "Client Comptoir"} {sale.prenomClient || ""}</p>
                                                        <p className="text-muted-foreground">{sale.numeroClient || "Pas de numéro de téléphone"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Items Table */}
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Articles</h4>
                                                <div className="rounded-2xl border overflow-hidden">
                                                    <Table>
                                                        <TableHeader className="bg-muted/50">
                                                            <TableRow className="hover:bg-transparent">
                                                                <TableHead className="font-bold text-[10px] uppercase">Désignation</TableHead>
                                                                <TableHead className="font-bold text-[10px] uppercase text-center">Qté</TableHead>
                                                                <TableHead className="font-bold text-[10px] uppercase text-right">Prix Unitaire</TableHead>
                                                                <TableHead className="font-bold text-[10px] uppercase text-right">Total</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {sale.items.map((item: any) => (
                                                                <TableRow key={item.id}>
                                                                    <TableCell className="font-bold py-4">{item.designation}</TableCell>
                                                                    <TableCell className="text-center py-4">x{item.quantite}</TableCell>
                                                                    <TableCell className="text-right py-4 text-muted-foreground">{item.prixUnitaire.toLocaleString()} F</TableCell>
                                                                    <TableCell className="text-right py-4 font-black">{item.total.toLocaleString()} F</TableCell>
                                                                </TableRow>
                                                            ))}
                                                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                                <TableCell colSpan={3} className="text-right font-black uppercase text-xs tracking-wider py-5">Montant Total Payé</TableCell>
                                                                <TableCell className="text-right font-black text-xl text-primary py-5">{sale.total.toLocaleString()} F</TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 px-1 pt-4 border-t">
                                                <Button
                                                    onClick={() => handleRePrint(sale)}
                                                    className="rounded-xl font-bold gap-2 shadow-md hover:shadow-lg transition-all"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    Réimprimer Reçu
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* sales pagination */}
                {filteredSales.length > pageSize && (
                    <div className="mt-4">
                        <Pagination
                            total={filteredSales.length}
                            page={page}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
