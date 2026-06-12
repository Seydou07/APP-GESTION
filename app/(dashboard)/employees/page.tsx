"use client"


import { useEffect, useState } from "react"
import { Plus, Search, Users, Banknote, Calendar, Printer, UserPlus, Eye } from "lucide-react"
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
import { Receipt } from "@/components/sales/receipt"
import { Pagination } from "@/components/ui/pagination"

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([])
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Pagination (employees list + payments history)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [paymentsPage, setPaymentsPage] = useState(1)
    const [paymentsPageSize, setPaymentsPageSize] = useState(10)

    useEffect(() => setPage(1), [searchTerm, pageSize, employees])
    useEffect(() => setPaymentsPage(1), [paymentsPageSize, payments])

    // Dialog states
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
    const [isPayModalOpen, setIsPayModalOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
    const [lastPayment, setLastPayment] = useState<any>(null) // To show receipt after payment
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [receiptData, setReceiptData] = useState<any>(null)
    const [settings, setSettings] = useState<any>(null)

    // Forms
    const [employeeForm, setEmployeeForm] = useState({
        lastName: "", firstName: "", position: "", phone: "", salaryBase: ""
    })
    const [paymentForm, setPaymentForm] = useState({
        period: format(new Date(), "MMMM yyyy", { locale: fr }),
        amount: "",
        note: "",
        paymentDate: format(new Date(), "yyyy-MM-dd")
    })

    useEffect(() => {
        fetchData()
        fetch("/api/settings").then(res => res.json()).then(setSettings)
    }, [])

    // derived lists for pagination
    const filteredEmployees = employees.filter((e: any) => {
        const searchLower = searchTerm.toLowerCase()
        const lastNameLower = (e.lastName ?? "").toLowerCase()
        const firstNameLower = (e.firstName ?? "").toLowerCase()
        const phone = e.phone ?? ""
        
        return lastNameLower.includes(searchLower) || firstNameLower.includes(searchLower) || phone.includes(searchTerm)
    })
    const displayedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize)

    const displayedPayments = payments.slice((paymentsPage - 1) * paymentsPageSize, paymentsPage * paymentsPageSize)

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
            setEmployeeForm({ lastName: "", firstName: "", position: "", phone: "", salaryBase: "" })
        } catch {
            toast.error("Erreur ajout employé")
        }
    }

    const openPayModal = (emp: any) => {
        setSelectedEmployee(emp)
        setPaymentForm({
            ...paymentForm,
            amount: emp.salaryBase.toString()
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
                    employeeId: selectedEmployee.id
                })
            })
            if (!res.ok) throw new Error()

            const payment = await res.json()
            toast.success("Paiement enregistré")
            handlePrintReceipt(payment)
            fetchData()
            setIsPayModalOpen(false)
        } catch {
            toast.error("Erreur paiement")
        }
    }

    // Receipt printing logic (Simulated)
    const handlePrintReceipt = (payment: any) => {
        setReceiptData({
            title: "Reçu de Salaire",
            client: `${payment.employee.lastName} ${payment.employee.firstName}`,
            date: format(new Date(payment.paymentDate), "dd/MM/yyyy HH:mm"),
            reference: payment.reference,
            items: [
                {
                    designation: `Paiement Salaire - ${payment.period}`,
                    quantite: 1,
                    prixUnitaire: payment.amount
                }
            ],
            total: payment.amount,
            extraInfo: [
                { label: "Poste", value: payment.employee.position || "-" },
                { label: "Note", value: payment.note || "-" }
            ],
            logoUrl: settings?.logoUrl,
            footerMessage: "Reçu généré par K.M.BOMI"
        })
    }

    const openDetailModal = (emp: any) => {
        setSelectedEmployee(emp)
        setIsDetailModalOpen(true)
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
                                    <Input required value={employeeForm.lastName} onChange={e => setEmployeeForm({ ...employeeForm, lastName: e.target.value })} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Prénom</Label>
                                    <Input required value={employeeForm.firstName} onChange={e => setEmployeeForm({ ...employeeForm, firstName: e.target.value })} className="rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Poste / Fonction</Label>
                                <Input placeholder="Ex: Vendeur, Gérant" value={employeeForm.position} onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Téléphone</Label>
                                <Input type="tel" value={employeeForm.phone} onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Salaire de base (FCFA)</Label>
                                <Input type="number" required value={employeeForm.salaryBase} onChange={e => setEmployeeForm({ ...employeeForm, salaryBase: e.target.value })} className="rounded-xl font-mono" />
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
                                        displayedEmployees.map((emp: any) => (
                                            <TableRow key={emp.id} className="hover:bg-muted/20">
                                                <TableCell className="pl-6 font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                            {emp.lastName[0]}
                                                        </div>
                                                        {emp.lastName} {emp.firstName}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{emp.position || "-"}</TableCell>
                                                <TableCell className="text-muted-foreground">{emp.phone || "-"}</TableCell>
                                                <TableCell className="text-right font-mono">{emp.salaryBase.toLocaleString()} F</TableCell>
                                                <TableCell className="text-center">
                                                    <Button size="sm" onClick={() => openPayModal(emp)} className="rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700">
                                                        <Banknote className="w-4 h-4 mr-2" /> Payer
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => openDetailModal(emp)} className="rounded-lg ml-2 text-muted-foreground hover:text-primary">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* employees pagination */}
                        {filteredEmployees.length > pageSize && (
                            <div className="mt-4">
                                <Pagination
                                    total={filteredEmployees.length}
                                    page={page}
                                    pageSize={pageSize}
                                    onPageChange={setPage}
                                    onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
                                />
                            </div>
                        )}
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
                                        displayedPayments.map((pay: any) => (
                                            <TableRow key={pay.id}>
                                                <TableCell className="pl-6">{format(new Date(pay.paymentDate), "dd/MM/yyyy")}</TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground">{pay.reference || "-"}</TableCell>
                                                <TableCell className="font-medium">{pay.employee?.lastName} {pay.employee?.firstName}</TableCell>
                                                <TableCell>{pay.period}</TableCell>
                                                <TableCell className="text-right font-bold">{pay.amount.toLocaleString()} F</TableCell>
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

                        {/* payments pagination */}
                        {payments.length > paymentsPageSize && (
                            <div className="mt-4">
                                <Pagination
                                    total={payments.length}
                                    page={paymentsPage}
                                    pageSize={paymentsPageSize}
                                    onPageChange={setPaymentsPage}
                                    onPageSizeChange={(s) => { setPaymentsPageSize(s); setPaymentsPage(1) }}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Payment Modal */}
            <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle>Payer un Salaire</DialogTitle>
                        <DialogDescription>
                            Paiement pour {selectedEmployee?.lastName} {selectedEmployee?.firstName}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayment} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Période concernée</Label>
                            <Input placeholder="Ex: Janvier 2026" required value={paymentForm.period} onChange={e => setPaymentForm({ ...paymentForm, period: e.target.value })} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Montant à payer (FCFA)</Label>
                            <Input type="number" required value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="rounded-xl font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label>Date du paiement</Label>
                            <Input type="date" required value={paymentForm.paymentDate} onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} className="rounded-xl" />
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

            {/* Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                            Détails de l'Employé
                        </DialogTitle>
                    </DialogHeader>

                    {selectedEmployee && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 bg-muted/30 rounded-2xl border space-y-4">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Informations Personnelles</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Nom Complet</p>
                                            <p className="font-bold text-lg">{selectedEmployee.lastName} {selectedEmployee.firstName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Téléphone</p>
                                            <p className="font-medium">{selectedEmployee.phone || "Non renseigné"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Poste Actuel</p>
                                            <p className="font-medium bg-primary/10 text-primary inline-block px-3 py-1 rounded-lg text-sm">{selectedEmployee.position}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-blue-600">Données Salariales</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-blue-600/70">Salaire de Base</p>
                                            <p className="font-black text-2xl text-blue-700">{selectedEmployee.salaryBase.toLocaleString()} F</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600/70">Total Payé (Historique)</p>
                                            <p className="font-bold text-lg text-blue-700">
                                                {payments.filter((p: any) => p.employeeId === selectedEmployee.id)
                                                    .reduce((acc: number, curr: any) => acc + curr.amount, 0).toLocaleString()} F
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-lg">Historique des Paiements</h3>
                                <div className="rounded-2xl border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="font-bold">Date</TableHead>
                                                <TableHead className="font-bold">Période</TableHead>
                                                <TableHead className="font-bold">Note</TableHead>
                                                <TableHead className="font-bold text-right">Montant</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.filter((p: any) => p.employeeId === selectedEmployee.id).length === 0 ? (
                                                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Aucun paiement trouvé</TableCell></TableRow>
                                            ) : (
                                                payments.filter((p: any) => p.employeeId === selectedEmployee.id).map((pay: any) => (
                                                    <TableRow key={pay.id}>
                                                        <TableCell>{format(new Date(pay.paymentDate), "dd/MM/yyyy")}</TableCell>
                                                        <TableCell>{pay.period}</TableCell>
                                                        <TableCell className="text-muted-foreground text-xs italic">{pay.reference || "-"}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold">{pay.amount.toLocaleString()} F</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Receipt Modal */}
            <Dialog open={!!receiptData} onOpenChange={(open) => !open && setReceiptData(null)}>
                <DialogContent className="max-w-lg bg-transparent border-none shadow-none p-6 max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <DialogTitle className="sr-only">Reçu de Paiement</DialogTitle>
                    <DialogDescription className="sr-only">Détails du paiement de salaire</DialogDescription>
                    {receiptData && (
                        <div className="relative">
                            <Receipt data={receiptData} />
                            <div className="absolute top-4 right-4 print:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setReceiptData(null)}
                                    className="bg-white/80 backdrop-blur-sm rounded-full"
                                >
                                    <Plus className="w-5 h-5 rotate-45" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
