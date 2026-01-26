"use client"

import { useEffect, useState } from "react"
import { Search, BookUser, TrendingDown, Plus, Banknote, History, CheckCircle2, AlertCircle, Clock } from "lucide-react"
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
import { cn } from "@/lib/utils"

export default function DebtsPage() {
    const [debts, setDebts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Payment Modal State
    const [selectedDebt, setSelectedDebt] = useState<any>(null)
    const [isPayModalOpen, setIsPayModalOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentNote, setPaymentNote] = useState("")

    // New Debt Modal State
    // Note: Main creation is via Sales, but keeping a manual option is good practice or can be disabled
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    useEffect(() => {
        fetchDebts()
    }, [])

    const fetchDebts = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/debts")
            const data = await res.json()
            setDebts(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Receipt Printing (Debt Payment)
    const handlePrintReceipt = (debt: any, paymentAmount: number, newBalance: number) => {
        const content = `
            REÇU DE PAIEMENT - K.M.BOMI
            --------------------------------
            Date: ${format(new Date(), "dd/MM/yyyy HH:mm")}
            
            CLIENT: ${debt.nomClient}
            Tél: ${debt.telephone}
            --------------------------------
            Total Dette Initial: ${debt.montantTotal.toLocaleString()} F
            Déjà Payé (Avant): ${(debt.montantVerse).toLocaleString()} F
            Reste (Avant): ${(debt.montantTotal - debt.montantVerse).toLocaleString()} F
            --------------------------------
            MONTANT VERSÉ: ${paymentAmount.toLocaleString()} F
            --------------------------------
            NOUVEAU RESTE: ${newBalance.toLocaleString()} F
            
            Signature: _______________
        `
        const win = window.open("", "Print", "width=400,height=600")
        if (win) {
            win.document.write(`<pre style="font-family: monospace; padding: 20px; font-size: 14px;">${content}</pre>`)
            win.document.close()
            win.print()
        }
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

            toast.success("Paiement enregistré")

            // Trigger Receipt
            handlePrintReceipt(selectedDebt, amount, newBalance)

            setIsPayModalOpen(false)
            setPaymentAmount("")
            setPaymentNote("")
            fetchDebts()
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du paiement")
        }
    }

    const filteredDebts = debts.filter((d: any) =>
        d.nomClient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.telephone.includes(searchTerm)
    )

    const totalDettes = filteredDebts.reduce((acc, d: any) => acc + (d.montantTotal - d.montantVerse), 0)

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

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Gestion des Dettes</h2>
                    <p className="text-muted-foreground">Suivez les crédits clients et enregistrez les règlements.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-background p-6 rounded-3xl border shadow-sm space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reste à Recouvrer</p>
                    <h3 className="text-2xl font-black">{totalDettes.toLocaleString()} F</h3>
                </div>
            </div>

            <div className="bg-background rounded-3xl shadow-sm border p-8 space-y-8">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un client..."
                        className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                                        {d.statut !== "REGLE" && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedDebt(d)
                                                    setPaymentAmount((d.montantTotal - d.montantVerse).toString())
                                                    setIsPayModalOpen(true)
                                                }}
                                                className="rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700"
                                            >
                                                <Banknote className="w-4 h-4 mr-2" /> Régler
                                            </Button>
                                        )}
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
        </div>
    )
}
