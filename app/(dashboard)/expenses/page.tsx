"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Wallet, TrendingDown, Calendar } from "lucide-react"
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

const CATEGORIES = [
    "LOYER", "EAU", "ELECTRICITE", "SALAIRE", "NOURRITURE",
    "TRANSPORT", "NETTOYAGE", "FOURNITURES", "AUTRE"
]

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                    <div className="grid grid-cols-2 gap-2 md:col-span-2">
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
                    </div>
                    <Button
                        onClick={fetchExpenses}
                        className="rounded-xl h-12 font-bold w-full md:col-start-4"
                        variant="secondary"
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
                                <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-right pr-8">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10">Chargement...</TableCell>
                                </TableRow>
                            ) : filteredExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Aucune dépense trouvée.</TableCell>
                                </TableRow>
                            ) : filteredExpenses.map((ex: any) => (
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
                                    <TableCell className="text-right pr-8 font-bold text-destructive">
                                        - {ex.montant.toLocaleString()} F
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
