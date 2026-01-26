"use client"


import { useEffect, useState } from "react"
import { Plus, Search, Users, Banknote, Calendar, Printer, UserPlus } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([])
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Dialog states
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
    const [isPayModalOpen, setIsPayModalOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
    const [lastPayment, setLastPayment] = useState<any>(null) // To show receipt after payment

    // Forms
    const [employeeForm, setEmployeeForm] = useState({
        nom: "", prenom: "", poste: "", telephone: "", salaireBase: ""
    })
    const [paymentForm, setPaymentForm] = useState({
        periode: format(new Date(), "MMMM yyyy", { locale: fr }),
        montant: "",
        note: "",
        date: format(new Date(), "yyyy-MM-dd")
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [empRes, payRes] = await Promise.all([
                fetch("/api/employees"),
                fetch("/api/employees/payments")
            ])
            if (empRes.ok) setEmployees(await empRes.json())
            if (payRes.ok) setPayments(await payRes.json())
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch("/api/employees", {
                method: "POST",
                body: JSON.stringify(employeeForm)
            })
            if (!res.ok) throw new Error()
            toast.success("Employé ajouté")
            fetchData()
            setIsAddEmployeeOpen(false)
            setEmployeeForm({ nom: "", prenom: "", poste: "", telephone: "", salaireBase: "" })
        } catch {
            toast.error("Erreur ajout employé")
        }
    }

    const openPayModal = (emp: any) => {
        setSelectedEmployee(emp)
        setPaymentForm({
            ...paymentForm,
            montant: emp.salaireBase.toString()
        })
        setIsPayModalOpen(true)
    }

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedEmployee) return

        try {
            const res = await fetch("/api/employees/payments", {
                method: "POST",
                body: JSON.stringify({
                    ...paymentForm,
                    employeId: selectedEmployee.id
                })
            })
            if (!res.ok) throw new Error()

            const payment = await res.json()
            toast.success("Paiement enregistré")
            setLastPayment(payment) // Show receipt?
            fetchData()
            setIsPayModalOpen(false)
        } catch {
            toast.error("Erreur paiement")
        }
    }

    // Receipt printing logic (Simulated)
    const handlePrintReceipt = (payment: any) => {
        // In a real app, this would open a formatted print window
        const content = `
            REÇU DE PAIEMENT - K.M.BOMI
            --------------------------------
            Ref: ${payment.reference || '-'}
            Date: ${format(new Date(payment.date), "dd/MM/yyyy")}
            
            Employé: ${payment.employe.nom} ${payment.employe.prenom}
            Période: ${payment.periode}
            
            MONTANT PAYÉ: ${payment.montant.toLocaleString()} FCFA
            
            Signature: _______________
        `
        const win = window.open("", "Print", "width=400,height=600")
        if (win) {
            win.document.write(`<pre style="font-family: monospace; padding: 20px;">${content}</pre>`)
            win.document.close()
            win.print()
        }
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Gestion du Personnel</h2>
                    <p className="text-muted-foreground">Gérez vos employés et le paiement des salaires.</p>
                </div>
                <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                            <UserPlus className="w-4 h-4" />
                            Ajouter un Employé
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle>Nouvel Employé</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddEmployee} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nom</Label>
                                    <Input required value={employeeForm.nom} onChange={e => setEmployeeForm({ ...employeeForm, nom: e.target.value })} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Prénom</Label>
                                    <Input required value={employeeForm.prenom} onChange={e => setEmployeeForm({ ...employeeForm, prenom: e.target.value })} className="rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Poste / Fonction</Label>
                                <Input placeholder="Ex: Vendeur, Gérant" value={employeeForm.poste} onChange={e => setEmployeeForm({ ...employeeForm, poste: e.target.value })} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Téléphone</Label>
                                <Input type="tel" value={employeeForm.telephone} onChange={e => setEmployeeForm({ ...employeeForm, telephone: e.target.value })} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Salaire de base (FCFA)</Label>
                                <Input type="number" required value={employeeForm.salaireBase} onChange={e => setEmployeeForm({ ...employeeForm, salaireBase: e.target.value })} className="rounded-xl font-mono" />
                            </div>
                            <Button type="submit" className="w-full rounded-xl font-bold h-12 mt-2">Enregistrer</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-2xl mb-6">
                    <TabsTrigger value="list" className="rounded-xl font-bold px-6">Liste des Employés</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl font-bold px-6">Historique des Paiements</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-6">
                    <div className="bg-background rounded-3xl shadow-sm border p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="relative w-72">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Rechercher un employé..." className="pl-10 rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="rounded-2xl border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="font-bold py-4 pl-6">Employé</TableHead>
                                        <TableHead className="font-bold py-4">Poste</TableHead>
                                        <TableHead className="font-bold py-4">Contact</TableHead>
                                        <TableHead className="font-bold py-4 text-right">Salaire Base</TableHead>
                                        <TableHead className="font-bold py-4 text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Chargement...</TableCell></TableRow> :
                                        employees.filter((e: any) => e.nom.toLowerCase().includes(searchTerm.toLowerCase())).map((emp: any) => (
                                            <TableRow key={emp.id} className="hover:bg-muted/20">
                                                <TableCell className="pl-6 font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                            {emp.nom[0]}
                                                        </div>
                                                        {emp.nom} {emp.prenom}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{emp.poste || "-"}</TableCell>
                                                <TableCell className="text-muted-foreground">{emp.telephone || "-"}</TableCell>
                                                <TableCell className="text-right font-mono">{emp.salaireBase.toLocaleString()} F</TableCell>
                                                <TableCell className="text-center">
                                                    <Button size="sm" onClick={() => openPayModal(emp)} className="rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700">
                                                        <Banknote className="w-4 h-4 mr-2" /> Payer
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <div className="bg-background rounded-3xl shadow-sm border p-8">
                        <div className="rounded-2xl border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="font-bold py-4 pl-6">Date</TableHead>
                                        <TableHead className="font-bold py-4">Ref</TableHead>
                                        <TableHead className="font-bold py-4">Employé</TableHead>
                                        <TableHead className="font-bold py-4">Période</TableHead>
                                        <TableHead className="font-bold py-4 text-right">Montant</TableHead>
                                        <TableHead className="font-bold py-4 text-center">Reçu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun paiement enregistré.</TableCell></TableRow> :
                                        payments.map((pay: any) => (
                                            <TableRow key={pay.id}>
                                                <TableCell className="pl-6">{format(new Date(pay.date), "dd/MM/yyyy")}</TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground">{pay.reference || "-"}</TableCell>
                                                <TableCell className="font-medium">{pay.employe?.nom} {pay.employe?.prenom}</TableCell>
                                                <TableCell>{pay.periode}</TableCell>
                                                <TableCell className="text-right font-bold">{pay.montant.toLocaleString()} F</TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="ghost" size="sm" onClick={() => handlePrintReceipt(pay)}>
                                                        <Printer className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Payment Modal */}
            <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle>Payer un Salaire</DialogTitle>
                        <DialogDescription>
                            Paiement pour {selectedEmployee?.nom} {selectedEmployee?.prenom}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayment} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Période concernée</Label>
                            <Input placeholder="Ex: Janvier 2026" required value={paymentForm.periode} onChange={e => setPaymentForm({ ...paymentForm, periode: e.target.value })} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Montant à payer (FCFA)</Label>
                            <Input type="number" required value={paymentForm.montant} onChange={e => setPaymentForm({ ...paymentForm, montant: e.target.value })} className="rounded-xl font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label>Date du paiement</Label>
                            <Input type="date" required value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Note (Optionnel)</Label>
                            <Input placeholder="Prime, avance..." value={paymentForm.note} onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })} className="rounded-xl" />
                        </div>
                        <Button type="submit" className="w-full rounded-xl font-bold h-12 mt-2 bg-emerald-600 hover:bg-emerald-700">
                            Confirmer le Paiement
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
