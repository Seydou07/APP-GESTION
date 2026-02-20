"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Wallet, TrendingDown, Calendar, Eye, FileText } from "lucide-react"
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
    DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { formatCompactNumber } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"

const CATEGORIES = [
    "LOYER", "EAU", "ELECTRICITE", "SALAIRE", "NOURRITURE",
    "TRANSPORT", "NETTOYAGE", "FOURNITURES", "AUTRE"
]

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedExpense, setSelectedExpense] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // pagination
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    useEffect(() => setPage(1), [searchTerm, startDate, endDate, pageSize, expenses])

    // Filter state
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"))
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [monthlyTotal, setMonthlyTotal] = useState(0)

    // Form state
    const [formData, setFormData] = useState({
        libelle: "",
        montant: "",
        categorie: "AUTRE",
        notes: "",
        date: format(new Date(), "yyyy-MM-dd")
    })

    useEffect(() => {
        fetchExpenses()
        fetchMonthlyTotal()
    }, [])

    const fetchMonthlyTotal = async () => {
        try {
            const start = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
            const end = format(new Date(), "yyyy-MM-dd")
            const res = await fetch(`/api/expenses?startDate=${start}&endDate=${end}`)
            if (res.ok) {
                const data = await res.json()
                const total = data.reduce((acc: number, curr: any) => acc + curr.montant, 0)
                setMonthlyTotal(total)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const fetchExpenses = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/expenses?startDate=${startDate}&endDate=${endDate}`)
            if (res.ok) {
                const data = await res.json()
                setExpenses(data)
            }
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors du chargement des dépenses")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error()

            toast.success("Dépense enregistrée")
            fetchExpenses()
            fetchMonthlyTotal()
            setIsAddDialogOpen(false)
            setFormData({
                libelle: "",
                montant: "",
                categorie: "AUTRE",
                notes: "",
                date: format(new Date(), "yyyy-MM-dd")
            })
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement")
        }
    }

    const filteredExpenses = expenses.filter((ex: any) =>
        ex.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.categorie.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const displayedExpenses = filteredExpenses.slice((page - 1) * pageSize, page * pageSize)

    const totalExpenses = filteredExpenses.reduce((acc, curr: any) => acc + curr.montant, 0)

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Gestion des Dépenses</h2>
                    <p className="text-muted-foreground">Suivez les coûts opérationnels de votre établissement.</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 bg-destructive hover:bg-destructive/90 text-white">
                            <Plus className="w-4 h-4" />
                            Nouvelle Dépense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle>Ajouter une Dépense</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid gap-2">
                                <Label>Libellé de la dépense</Label>
                                <Input
                                    required
                                    placeholder="Ex: Facture SODECI"
                                    value={formData.libelle}
                                    onChange={e => setFormData({ ...formData, libelle: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Montant (FCFA)</Label>
                                <Input
                                    required
                                    type="number"
                                    placeholder="0"
                                    value={formData.montant}
                                    onChange={e => setFormData({ ...formData, montant: e.target.value })}
                                    className="rounded-xl font-mono"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Catégorie</Label>
                                <Select
                                    value={formData.categorie}
                                    onValueChange={v => setFormData({ ...formData, categorie: v })}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes (Optionnel)</Label>
                                <Textarea
                                    placeholder="Détails supplémentaires..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="rounded-xl resize-none"
                                />
                            </div>
                            <Button type="submit" className="w-full rounded-xl font-bold h-12 mt-2">
                                Enregistrer
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-background p-6 rounded-3xl border shadow-sm space-y-2 group hover:border-primary/50 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Dépenses du Mois</p>
                        <h3 className="text-2xl font-black text-primary" title={monthlyTotal.toLocaleString() + " F"}>
                            {monthlyTotal > 999999 ? formatCompactNumber(monthlyTotal) : monthlyTotal.toLocaleString()} F
                        </h3>
                    </div>
                </div>

                <div className="bg-background p-6 rounded-3xl border shadow-sm space-y-2 group hover:border-destructive/50 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Filtré</p>
                        <h3 className="text-2xl font-black text-destructive" title={totalExpenses.toLocaleString() + " F"}>
                            {totalExpenses > 999999 ? formatCompactNumber(totalExpenses) : totalExpenses.toLocaleString()} F
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-background rounded-3xl shadow-sm border p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2 relative">
                        <Label className="text-xs font-bold uppercase mb-2 block">Recherche</Label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher une dépense..."
                                className="pl-12 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs font-bold uppercase mb-2 block">Du</Label>
                        <Input
                            type="date"
                            className="rounded-xl h-12"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold uppercase mb-2 block">Au</Label>
                        <Input
                            type="date"
                            className="rounded-xl h-12"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={fetchExpenses}
                        className="rounded-xl h-12 font-bold w-full shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                        Filtrer
                    </Button>
                </div>

                <div className="rounded-2xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-bold text-xs uppercase tracking-wider pl-8 py-4">Date</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider py-4">Libellé</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider py-4">Catégorie</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-right">Montant</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-center pr-8">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">Chargement...</TableCell>
                                </TableRow>
                            ) : filteredExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Aucune dépense trouvée.</TableCell>
                                </TableRow>
                            ) : displayedExpenses.map((ex: any) => (
                                <TableRow key={ex.id} className="hover:bg-muted/20">
                                    <TableCell className="pl-8 font-medium">
                                        {format(new Date(ex.date), "dd MMM yyyy", { locale: fr })}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-semibold">{ex.libelle}</p>
                                        {ex.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{ex.notes}</p>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground uppercase">
                                            {ex.categorie}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-destructive">
                                        - {ex.montant.toLocaleString()} F
                                    </TableCell>
                                    <TableCell className="text-center pr-8">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                setSelectedExpense(ex)
                                                setIsDetailModalOpen(true)
                                            }}
                                            className="rounded-lg text-muted-foreground hover:text-primary"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* expenses pagination */}
                {filteredExpenses.length > pageSize && (
                    <div className="mt-4">
                        <Pagination
                            total={filteredExpenses.length}
                            page={page}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
                        />
                    </div>
                )
            </div>

            {/* Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <Wallet className="w-5 h-5" />
                            </div>
                            Détails de la Dépense
                        </DialogTitle>
                    </DialogHeader>

                    {selectedExpense && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 bg-muted/30 rounded-2xl border space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Infos Générales</h4>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Libellé</p>
                                        <p className="font-bold text-lg">{selectedExpense.libelle}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Catégorie</p>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground mt-1">
                                            {selectedExpense.categorie}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Date</p>
                                        <p className="font-medium">{format(new Date(selectedExpense.date), "dd MMMM yyyy", { locale: fr })}</p>
                                    </div>
                                </div>

                                <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col justify-center items-center text-center space-y-2">
                                    <p className="text-sm font-bold text-red-600 uppercase tracking-widest">Montant</p>
                                    <p className="font-black text-4xl text-red-600">{selectedExpense.montant.toLocaleString()} F</p>
                                </div>
                            </div>

                            {selectedExpense.notes && (
                                <div className="p-5 bg-yellow-50/50 rounded-2xl border border-yellow-100 space-y-3">
                                    <div className="flex items-center gap-2 text-yellow-700">
                                        <FileText className="w-4 h-4" />
                                        <h4 className="font-bold text-sm uppercase tracking-widest">Notes & Détails</h4>
                                    </div>
                                    <p className="text-sm text-yellow-900 leading-relaxed whitespace-pre-wrap">
                                        {selectedExpense.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
