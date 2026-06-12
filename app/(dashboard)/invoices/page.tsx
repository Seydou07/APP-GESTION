"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { InvoiceA4 } from "@/components/sales/invoice-a4"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Invoice {
    id: number
    invoiceNumber: string
    invoiceDate: string
    dueDate: string
    status: string
    totalHt: number
    totalTva: number
    totalTtc: number
    notes: string | null
    client: {
        id: number
        name: string
        phone: string | null
        email: string | null
        address: string | null
    } | null
    sale: {
        id: number
        items: any[]
    } | null
}

const statusLabels: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    PAYEE: "Payée",
    ANNULEE: "Annulée",
}

const statusColors: Record<string, string> = {
    BROUILLON: "bg-gray-100 text-gray-800",
    ENVOYEE: "bg-blue-100 text-blue-800",
    PAYEE: "bg-green-100 text-green-800",
    ANNULEE: "bg-red-100 text-red-800",
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

    useEffect(() => {
        fetchInvoices()
    }, [])

    const fetchInvoices = async () => {
        try {
            const res = await fetch("/api/invoices")
            if (res.ok) {
                const data = await res.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors du chargement des factures")
        } finally {
            setLoading(false)
        }
    }

    const filteredInvoices = invoices.filter(inv => {
        const searchLower = search.toLowerCase()
        const invoiceNumLower = (inv.invoiceNumber ?? "").toLowerCase()
        const clientNameLower = (inv.client?.name ?? "").toLowerCase()
        const clientPhone = inv.client?.phone ?? ""
        
        const matchesSearch = invoiceNumLower.includes(searchLower) ||
            clientNameLower.includes(searchLower) ||
            clientPhone.includes(search)
        
        const matchesStatus = statusFilter === "all" || inv.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Factures Clients</h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par numéro, client, téléphone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="BROUILLON">Brouillons</SelectItem>
                        <SelectItem value="ENVOYEE">Envoyées</SelectItem>
                        <SelectItem value="PAYEE">Payées</SelectItem>
                        <SelectItem value="ANNULEE">Annulées</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Invoices List */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des Factures ({filteredInvoices.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Chargement...</div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Aucune facture trouvée</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N° Facture</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total HT</TableHead>
                                    <TableHead>TVA</TableHead>
                                    <TableHead>Total TTC</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-bold">{invoice.invoiceNumber}</TableCell>
                                        <TableCell>{invoice.client?.name || "-"}</TableCell>
                                        <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}</TableCell>
                                        <TableCell>{invoice.totalHt.toLocaleString()} F</TableCell>
                                        <TableCell>{invoice.totalTva.toLocaleString()} F</TableCell>
                                        <TableCell className="font-bold">{invoice.totalTtc.toLocaleString()} F</TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[invoice.status]}>
                                                {statusLabels[invoice.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedInvoice(invoice)}
                                                    >
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Voir
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-5xl">
                                                    <DialogHeader>
                                                        <DialogTitle>{invoice.invoiceNumber}</DialogTitle>
                                                        <DialogDescription>
                                                            {invoice.client?.name || "Client comptoir"} - {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    {selectedInvoice && (
                                                        <InvoiceA4
                                                            invoice={selectedInvoice}
                                                            onPrint={() => window.print()}
                                                        />
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
