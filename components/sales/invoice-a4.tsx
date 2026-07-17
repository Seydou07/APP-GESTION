"use client"

import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface InvoiceItem {
    designation: string
    quantity: number
    priceUnit: number
    subtotal: number
}

export interface InvoiceData {
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

interface InvoiceA4Props {
    invoice: InvoiceData
    onPrint?: () => void
}

const statusLabels: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    PAYEE: "Payée",
    ANNULEE: "Annulée",
}

export function InvoiceA4({ invoice, onPrint }: InvoiceA4Props) {
    const items: InvoiceItem[] = invoice.sale?.items.map(item => ({
        designation: item.designation || item.name || "",
        quantity: item.quantity || 0,
        priceUnit: item.priceUnit || item.price || 0,
        subtotal: item.subtotal || (item.priceUnit || item.price || 0) * (item.quantity || 0)
    })) || []

    return (
        <div className="space-y-4">
            <div id="invoice-content" className="bg-white text-black p-6 max-w-2xl mx-auto shadow-sm border print:shadow-none print:border-none print:p-0 print:max-w-full print:mx-0">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">K.M.BOMI</h1>
                        <p className="text-gray-600 mt-1">GESTION COMMERCIALE</p>
                        <p className="text-sm text-gray-500 mt-2">Email: contact@kmbomi.com</p>
                        <p className="text-sm text-gray-500">Téléphone: +225 00 00 00 00</p>
                        <p className="text-sm text-gray-500">Adresse: Abidjan, Côte d'Ivoire</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-primary text-white px-6 py-2 rounded-lg inline-block mb-4">
                            <h2 className="text-2xl font-bold">FACTURE</h2>
                        </div>
                        <p className="font-bold text-lg">{invoice.invoiceNumber}</p>
                        <p className="text-gray-600">Date: {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}</p>
                        <p className="text-gray-600">Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <h3 className="font-bold text-base mb-2">Client</h3>
                    <p className="font-bold">{invoice.client?.name || "Client Comptoir"}</p>
                    {invoice.client?.phone && <p className="text-gray-600">Tel: {invoice.client.phone}</p>}
                    {invoice.client?.email && <p className="text-gray-600">Email: {invoice.client.email}</p>}
                    {invoice.client?.address && <p className="text-gray-600">Adresse: {invoice.client.address}</p>}
                </div>

                <div className="mb-4">
                    <Table>
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="font-bold">Désignation</TableHead>
                                <TableHead className="font-bold text-center">Qté</TableHead>
                                <TableHead className="font-bold text-right">Prix Unit.</TableHead>
                                <TableHead className="font-bold text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                        Aucun article
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{item.designation}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{item.priceUnit.toLocaleString()} F</TableCell>
                                        <TableCell className="text-right font-bold">{item.subtotal.toLocaleString()} F</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end">
                    <div className="w-full max-w-sm border-t-2 pt-4">
                        <div className="flex justify-between py-1">
                            <span className="font-medium">Total HT</span>
                            <span className="font-mono">{invoice.totalHt.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="font-medium">TVA (18%)</span>
                            <span className="font-mono">{invoice.totalTva.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between py-3 border-t-2 text-lg font-bold">
                            <span>Total TTC</span>
                            <span className="text-primary">{invoice.totalTtc.toLocaleString()} FCFA</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t text-center text-sm text-gray-500">
                    <p className="mb-2">Merci pour votre confiance !</p>
                    <p>Statut: <span className="font-bold">{statusLabels[invoice.status]}</span></p>
                    {invoice.notes && <p className="mt-4 italic text-gray-600">Note: {invoice.notes}</p>}
                </div>
            </div>

            <div className="flex justify-center gap-3 print:hidden">
                <Button onClick={() => onPrint?.()} className="gap-2 px-6">
                    <Printer className="w-4 h-4" />
                    Imprimer
                </Button>
                <Button variant="outline" className="gap-2 px-6">
                    <Download className="w-4 h-4" />
                    Télécharger PDF
                </Button>
            </div>
        </div>
    )
}
