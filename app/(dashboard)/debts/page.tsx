"use client"

import { useEffect, useState } from "react"
import { Search, BookUser, TrendingDown, Plus, Banknote, History, CheckCircle2, AlertCircle, Clock, Eye } from "lucide-react"
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
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { Receipt } from "@/components/sales/receipt"
import { cn } from "@/lib/utils"

export default function DebtsPage() {
    const [debts, setDebts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Filter state
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"))
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [monthlyNewDebts, setMonthlyNewDebts] = useState(0)

    // Payment Modal State
    const [selectedDebt, setSelectedDebt] = useState<any>(null)
    const [isPayModalOpen, setIsPayModalOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentNote, setPaymentNote] = useState("")

    // New Debt Modal State
    // Note: Main creation is via Sales, but keeping a manual option is good practice or can be disabled
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [receiptData, setReceiptData] = useState<any>(null)
    const [settings, setSettings] = useState<any>(null)

    useEffect(() => {
        fetchDebts()
        fetchMonthlyNewDebts()
        fetch("/api/settings").then(res => res.json()).then(setSettings)
    }, [])

    const fetchMonthlyNewDebts = async () => {
        try {
            const start = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
            const end = format(new Date(), "yyyy-MM-dd")
            const res = await fetch(`/api/debts?startDate=${start}&endDate=${end}`)
            if (res.ok) {
                const data = await res.json()
                const total = data.reduce((acc: number, curr: any) => acc + curr.montantTotal, 0)
                setMonthlyNewDebts(total)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const fetchDebts = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/debts?startDate=${startDate}&endDate=${endDate}`)
            const data = await res.json()
            setDebts(data)
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors du chargement des dettes")
        } finally {
            setLoading(false)
        }
    }

    // Receipt Printing (Debt Payment)
    const handlePrintReceipt = (debt: any, paymentAmount: number, newBalance: number) => {
        setReceiptData({
            title: "Reçu de Règlement",
            subtitle: "Paiement de Crédit Client",
            client: debt.nomClient,
            date: format(new Date(), "dd/MM/yyyy HH:mm"),
            items: [
                {
                    designation: "Règlement partiel/total de dette",
                    quantite: 1,
                    prixUnitaire: paymentAmount
                }
            ],
            total: paymentAmount,
            extraInfo: [
                { label: "Ancien Reste", value: `${(debt.montantTotal - debt.montantVerse).toLocaleString()} F` },
                { label: "Nouveau Reste", value: `${newBalance.toLocaleString()} F` },
                { label: "Téléphone", value: debt.telephone }
            ],
            logoUrl: settings?.logoUrl,
            footerMessage: "Merci pour votre règlement !"
        })
    }

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDebt) return

        const amount = Number(paymentAmount)
        const currentPaid = selectedDebt.montantVerse
        const total = selectedDebt.montantTotal
        const newPaid = currentPaid + amount
        const newBalance = total - newPaid

        try {
            const res = await fetch(`/api/debts/${selectedDebt.id}/pay`, {
                method: "POST",
                body: JSON.stringify({
                    montant: paymentAmount,
                    note: paymentNote
                })
            })

            if (!res.ok) {
                const err = await res.text()
                throw new Error(err)
            }

            toast.success("Paiement de dette enregistré avec succès")

            // Trigger Receipt
            handlePrintReceipt(selectedDebt, amount, newBalance)

            setIsPayModalOpen(false)
            setPaymentAmount("")
            setPaymentNote("")
            handlePaymentSuccess()
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du paiement")
        }
    }

    const filteredDebts = debts.filter((d: any) =>
        d.nomClient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.telephone.includes(searchTerm)
    )

    const totalDettes = filteredDebts.reduce((acc, d: any) => acc + (d.montantTotal - d.montantVerse), 0)

    const handlePaymentSuccess = () => {
        fetchDebts()
        fetchMonthlyNewDebts()
    }

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case "IMPAYE":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><AlertCircle className="w-3 h-3" /> Impayé</span>
            case "PARTIEL":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700"><Clock className="w-3 h-3" /> Partiel</span>
            case "REGLE":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Réglé</span>
            default:
                return null
        }
    }

    if (receiptData) {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between print:hidden">
                    <h2 className="text-2xl font-black tracking-tight">Reçu de Paiement</h2>
                    <Button
                        variant="outline"
                        onClick={() => setReceiptData(null)}
                        className="rounded-xl gap-2"
                    >
                        <History className="w-4 h-4" /> Retour aux dettes
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Gestion des Dettes</h2>
                    <p className="text-muted-foreground">Suivez les crédits clients et enregistrez les règlements.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-background p-6 rounded-3xl border shadow-sm space-y-2 group hover:border-indigo-500/50 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Plus className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nouvelles Dettes (Mois)</p>
                        <h3 className="text-2xl font-black text-indigo-600">{monthlyNewDebts.toLocaleString()} F</h3>
                    </div>
                </div>

                <div className="bg-background p-6 rounded-3xl border shadow-sm space-y-2 group hover:border-primary/50 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reste à Recouvrer (Filtré)</p>
                        <h3 className="text-2xl font-black text-primary">{totalDettes.toLocaleString()} F</h3>
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
                                placeholder="Rechercher un client ou téléphone..."
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
                        onClick={fetchDebts}
                        className="rounded-xl h-12 font-bold w-full shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                        Filtrer
                    </Button>
                </div>

                <div className="rounded-2xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold py-4 pl-6">Client</TableHead>
                                <TableHead className="font-bold py-4">Date</TableHead>
                                <TableHead className="font-bold py-4 text-right">Total</TableHead>
                                <TableHead className="font-bold py-4 text-right">Versé</TableHead>
                                <TableHead className="font-bold py-4 text-right text-indigo-600">Reste</TableHead>
                                <TableHead className="font-bold py-4 text-center">Statut</TableHead>
                                <TableHead className="font-bold py-4 text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-10">Chargement...</TableCell></TableRow>
                            ) : filteredDebts.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Aucune dette trouvée.</TableCell></TableRow>
                            ) : filteredDebts.map((d: any) => (
                                <TableRow key={d.id} className="hover:bg-muted/20">
                                    <TableCell className="pl-6 font-medium">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{d.nomClient}</span>
                                            <span className="text-xs text-muted-foreground">{d.telephone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{format(new Date(d.date), "dd/MM/yyyy")}</TableCell>
                                    <TableCell className="text-right font-mono">{d.montantTotal.toLocaleString()} F</TableCell>
                                    <TableCell className="text-right font-mono text-emerald-600">{d.montantVerse.toLocaleString()} F</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-indigo-600">{(d.montantTotal - d.montantVerse).toLocaleString()} F</TableCell>
                                    <TableCell className="text-center">{getStatusBadge(d.statut)}</TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setSelectedDebt(d)
                                                setPaymentAmount((d.montantTotal - d.montantVerse).toString())
                                                setIsPayModalOpen(true)
                                            }}
                                            disabled={d.statut === "REGLE"}
                                            className={cn(
                                                "rounded-lg font-bold transition-all",
                                                d.statut === "REGLE"
                                                    ? "bg-muted text-muted-foreground border-none opacity-50 cursor-not-allowed"
                                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                            )}
                                        >
                                            <Banknote className="w-4 h-4 mr-2" /> Régler
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                setSelectedDebt(d)
                                                setIsDetailModalOpen(true)
                                            }}
                                            className="rounded-lg ml-2 text-muted-foreground hover:text-primary"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Payment Dialog */}
            <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle>Encaisser un Paiement</DialogTitle>
                        <DialogDescription>
                            Règlement pour la dette de <strong>{selectedDebt?.nomClient}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayment} className="space-y-4 mt-4">
                        <div className="p-4 bg-muted/50 rounded-xl space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>Total Dette:</span>
                                <span className="font-bold">{selectedDebt?.montantTotal.toLocaleString()} F</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Déjà payé:</span>
                                <span className="font-bold text-emerald-600">{selectedDebt?.montantVerse.toLocaleString()} F</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t mt-2">
                                <span>Reste à payer:</span>
                                <span className="font-bold text-indigo-600">{(selectedDebt?.montantTotal - selectedDebt?.montantVerse).toLocaleString()} F</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Montant du versement (FCFA)</Label>
                            <Input
                                type="number"
                                required
                                max={selectedDebt ? selectedDebt.montantTotal - selectedDebt.montantVerse : 0}
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                className="rounded-xl font-mono text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Note (Optionnel)</Label>
                            <Input
                                placeholder="Mode de paiement, etc."
                                value={paymentNote}
                                onChange={e => setPaymentNote(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>

                        <Button type="submit" className="w-full rounded-xl font-bold h-12 mt-2 bg-indigo-600 hover:bg-indigo-700">
                            Confirmer l'Encaissement
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <BookUser className="w-5 h-5" />
                            </div>
                            Détails de la Dette
                        </DialogTitle>
                    </DialogHeader>

                    {selectedDebt && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 bg-muted/30 rounded-2xl border space-y-4">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Client</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Nom Client</p>
                                            <p className="font-bold text-lg">{selectedDebt.nomClient}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Téléphone</p>
                                            <p className="font-medium">{selectedDebt.telephone}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Date Création</p>
                                            <p className="font-medium">{format(new Date(selectedDebt.date), "dd MMMM yyyy", { locale: fr })}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Statut Actuel</p>
                                            <div className="mt-1">{getStatusBadge(selectedDebt.statut)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-indigo-600">Situation Financière</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
                                            <p className="text-sm font-medium text-indigo-900">Montant Total</p>
                                            <p className="font-black text-xl text-indigo-900">{selectedDebt.montantTotal.toLocaleString()} F</p>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
                                            <p className="text-sm font-medium text-emerald-700">Déjà Versé</p>
                                            <p className="font-bold text-lg text-emerald-700">{selectedDebt.montantVerse.toLocaleString()} F</p>
                                        </div>
                                        <div className="flex justify-between items-center pt-1">
                                            <p className="text-sm font-black uppercase text-red-600">Reste à Payer</p>
                                            <p className="font-black text-2xl text-red-600">{(selectedDebt.montantTotal - selectedDebt.montantVerse).toLocaleString()} F</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-lg">Historique des Règlements</h3>
                                <div className="rounded-2xl border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="font-bold">Date</TableHead>
                                                <TableHead className="font-bold">Note</TableHead>
                                                <TableHead className="font-bold text-right">Montant</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedDebt.paiements && selectedDebt.paiements.length > 0 ? (
                                                selectedDebt.paiements.map((pay: any) => (
                                                    <TableRow key={pay.id}>
                                                        <TableCell>{format(new Date(pay.date), "dd/MM/yyyy HH:mm")}</TableCell>
                                                        <TableCell className="text-muted-foreground italic">{pay.note || "-"}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-emerald-600">+{pay.montant.toLocaleString()} F</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Aucun règlement enregistré</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
